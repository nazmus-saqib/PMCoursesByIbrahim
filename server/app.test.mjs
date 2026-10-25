import assert from 'node:assert/strict';
import { once } from 'node:events';
import { mkdtemp, mkdir, readFile, rm, stat, symlink, writeFile } from 'node:fs/promises';
import { spawn, spawnSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { createServer as createViteServer, loadConfigFromFile } from 'vite';
import { createApp } from './app.mjs';
import { csvCell, exportRegistrations } from './export-registrations.mjs';

const registration = {
  name: 'Test Professional',
  email: 'test@example.com',
  courseId: 'project-management',
  consent: true,
};

async function fixture(t, options = {}) {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'ibrahim-registration-test-'));
  const application = createApp({ dataDir: path.join(directory, 'data'), ...options });
  const server = application.app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}`;
  t.after(async () => {
    server.closeAllConnections();
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    application.close();
    await rm(directory, { recursive: true, force: true });
  });
  return {
    ...application,
    directory,
    base,
    request: (body, extra = {}) => fetch(`${base}/api/registrations`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...extra.headers },
      body: JSON.stringify(body),
      ...Object.fromEntries(Object.entries(extra).filter(([key]) => key !== 'headers')),
    }),
  };
}

test('a valid request is durably recorded with consent, pending status, and an opaque reference', async (t) => {
  const { request, db, databasePath } = await fixture(t);
  const response = await request({ ...registration, email: '  TEST@example.com  ', phone: '+1 555 0100', goal: 'Lead my first project.' });
  assert.equal(response.status, 201);
  const payload = await response.json();
  assert.equal(payload.ok, true);
  assert.match(payload.reference, /^[a-f0-9-]{36}$/);
  assert.match(payload.message, /not confirmed/);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  const saved = db.prepare('SELECT * FROM registrations').get();
  assert.equal(saved.id, payload.reference);
  assert.equal(saved.email, 'test@example.com');
  assert.equal(saved.phone, '+1 555 0100');
  assert.equal(saved.status, 'pending');
  assert.ok(!Number.isNaN(Date.parse(saved.consent_at)));
  // A second independent SQLite connection sees the committed request.
  const { DatabaseSync } = await import('node:sqlite');
  const reopened = new DatabaseSync(databasePath, { readOnly: true });
  assert.equal(reopened.prepare('SELECT COUNT(*) AS count FROM registrations').get().count, 1);
  reopened.close();
});

test('repeated submissions are idempotent without revealing existing personal details', async (t) => {
  const { request, db } = await fixture(t);
  const first = await (await request(registration)).json();
  const duplicateResponse = await request({ ...registration, name: 'Different name' });
  assert.equal(duplicateResponse.status, 201);
  const second = await duplicateResponse.json();
  assert.equal(second.reference, first.reference);
  assert.deepEqual(Object.keys(second).sort(), ['message', 'ok', 'reference']);
  assert.equal(db.prepare('SELECT COUNT(*) AS count FROM registrations').get().count, 1);
  assert.equal(db.prepare('SELECT name FROM registrations').get().name, registration.name);
});

test('validation rejects missing consent, unknown courses, malformed email, and oversized fields', async (t) => {
  const { request, db } = await fixture(t);
  const response = await request({ ...registration, email: 'invalid', courseId: 'invented', name: 'x'.repeat(121), consent: false });
  assert.equal(response.status, 400);
  const payload = await response.json();
  for (const field of ['email', 'courseId', 'name', 'consent']) assert.ok(payload.fieldErrors[field]);
  assert.equal(db.prepare('SELECT COUNT(*) AS count FROM registrations').get().count, 0);
  const invalidShape = await request([registration]);
  assert.equal(invalidShape.status, 400);
});

test('parameterized SQL safely stores apostrophes and SQL-like input', async (t) => {
  const { request, db } = await fixture(t);
  const goal = "'); DROP TABLE registrations; --";
  assert.equal((await request({ ...registration, name: "Sam O'Brien", goal })).status, 201);
  assert.equal(db.prepare('SELECT goal FROM registrations').get().goal, goal);
});

test('API has no public registration list or private-data retrieval route', async (t) => {
  const { request, base } = await fixture(t);
  const saved = await (await request(registration)).json();
  for (const route of ['/api/registrations', `/api/registrations/${saved.reference}`, '/data/registrations.sqlite']) {
    const response = await fetch(base + route);
    assert.equal(response.status, 404);
    assert.doesNotMatch(await response.text(), /test@example.com|Test Professional/);
  }
  assert.deepEqual(await (await fetch(base + '/api/health')).json(), { ok: true });
});

test('cross-origin requests are rejected while same-origin submissions work', async (t) => {
  const { request, base, db } = await fixture(t);
  assert.equal((await request(registration, { headers: { origin: 'https://unrelated.example' } })).status, 403);
  assert.equal((await request(registration, { headers: { 'sec-fetch-site': 'cross-site' } })).status, 403);
  assert.equal(db.prepare('SELECT COUNT(*) AS count FROM registrations').get().count, 0);
  assert.equal((await request(registration, { headers: { origin: base } })).status, 201);
});

test('honeypot submissions do not store data', async (t) => {
  const { request, db } = await fixture(t);
  assert.equal((await request({ ...registration, website: 'https://spam.example' })).status, 201);
  assert.equal(db.prepare('SELECT COUNT(*) AS count FROM registrations').get().count, 0);
});

test('request format and size limits preserve the registration database', async (t) => {
  const { request, db } = await fixture(t);
  assert.equal((await request(registration, { headers: { 'content-type': 'text/plain' } })).status, 415);
  assert.equal((await request(registration, { body: '{broken' })).status, 400);
  assert.equal((await request({ ...registration, goal: 'x'.repeat(18000) })).status, 413);
  assert.equal(db.prepare('SELECT COUNT(*) AS count FROM registrations').get().count, 0);
});

test('rate limiting applies to repeated requests and reports a retry delay', async (t) => {
  const { request, db } = await fixture(t, { rateLimitMax: 2 });
  assert.equal((await request(registration)).status, 201);
  assert.equal((await request({ ...registration, email: 'second@example.com' })).status, 201);
  const response = await request({ ...registration, email: 'third@example.com' });
  assert.equal(response.status, 429);
  assert.ok(Number(response.headers.get('retry-after')) > 0);
  assert.equal(db.prepare('SELECT COUNT(*) AS count FROM registrations').get().count, 2);
});

test('production serves the built website and SPA routes without swallowing missing files or API routes', async (t) => {
  const dist = await mkdtemp(path.join(os.tmpdir(), 'ibrahim-dist-test-'));
  t.after(() => rm(dist, { recursive: true, force: true }));
  await mkdir(path.join(dist, 'assets'));
  await writeFile(path.join(dist, 'index.html'), '<!doctype html><h1>Course website</h1>');
  await writeFile(path.join(dist, 'assets', 'app.js'), 'window.websiteLoaded = true;');
  const { base } = await fixture(t, { serveStatic: true, distDir: dist });
  const home = await fetch(base, { headers: { accept: 'text/html' } });
  assert.equal(home.status, 200);
  assert.match(await home.text(), /Course website/);
  const detail = await fetch(base + '/courses/agile', { headers: { accept: 'text/html' } });
  assert.equal(detail.status, 200);
  assert.match(await detail.text(), /Course website/);
  assert.equal((await fetch(base + '/assets/app.js')).status, 200);
  assert.equal((await fetch(base + '/assets/missing.js')).status, 404);
  assert.equal((await fetch(base + '/api/unknown', { headers: { accept: 'text/html' } })).status, 404);
});

test('production reports a missing build without claiming readiness', async (t) => {
  const { base } = await fixture(t, { serveStatic: true, distDir: '/nonexistent-ibrahim-build' });
  const response = await fetch(base, { headers: { accept: 'text/html' } });
  assert.equal(response.status, 503);
  assert.match(await response.text(), /npm run build/);
});

test('private CSV export preserves requests, escapes formulas, and refuses overwriting files', async (t) => {
  const { request, directory } = await fixture(t);
  assert.equal((await request({ ...registration, name: '="unsafe formula"', phone: '+15550100', goal: 'Line one\nLine two, quoted "text"' })).status, 201);
  const output = path.join(directory, 'requests.csv');
  const { count } = exportRegistrations({ dataDir: path.join(directory, 'data'), output });
  assert.equal(count, 1);
  const csv = await readFile(output, 'utf8');
  assert.match(csv, /"'=""unsafe formula"""/);
  assert.match(csv, /"'\+15550100"/);
  assert.match(csv, /Line one\nLine two, quoted ""text""/);
  assert.match(csv, /test@example.com/);
  assert.equal((await stat(output)).mode & 0o777, 0o600);
  assert.throws(() => exportRegistrations({ dataDir: path.join(directory, 'data'), output }), { code: 'EEXIST' });
  assert.equal(csvCell('\t=1+1'), '"\'\t=1+1"');
  assert.throws(() => exportRegistrations({ dataDir: path.join(directory, 'missing') }), /No registration database/);
});

test('DATA_DIR cannot expose registrations through public, dist, or symlinked public directories', async (t) => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'ibrahim-private-dir-test-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const publicDir = path.join(directory, 'public');
  const distDir = path.join(directory, 'dist');
  await mkdir(publicDir);
  await mkdir(distDir);
  await symlink(publicDir, path.join(directory, 'aliased-public'));
  for (const dataDir of [publicDir, path.join(publicDir, 'records'), distDir, path.join(directory, 'aliased-public', 'records')]) {
    assert.throws(() => createApp({ dataDir, publicDir, distDir }), /DATA_DIR must be outside/);
  }
});

test('proxy trust uses the nearest forwarded address and direct mode ignores spoofed forwarding headers', async (t) => {
  const trusted = await fixture(t, { trustProxy: 1, rateLimitMax: 1 });
  assert.equal((await trusted.request(registration, { headers: { 'x-forwarded-for': '192.0.2.10, 198.51.100.10' } })).status, 201);
  assert.equal((await trusted.request(registration, { headers: { 'x-forwarded-for': '192.0.2.11, 198.51.100.10' } })).status, 429);
  const direct = await fixture(t, { rateLimitMax: 1 });
  assert.equal((await direct.request(registration, { headers: { 'x-forwarded-for': '192.0.2.10' } })).status, 201);
  assert.equal((await direct.request(registration, { headers: { 'x-forwarded-for': '192.0.2.11' } })).status, 429);
});

test('export CLI writes privately, refuses overwriting, and reports a missing database without creating one', async (t) => {
  const { request, directory } = await fixture(t);
  await request(registration);
  const script = path.resolve('server/export-registrations.mjs');
  const output = path.join(directory, 'cli-export.csv');
  const options = { encoding: 'utf8', env: { ...process.env, DATA_DIR: path.join(directory, 'data') } };
  const first = spawnSync(process.execPath, [script, '--out', output], options);
  assert.equal(first.status, 0, first.stderr);
  assert.equal(first.stdout, '');
  assert.match(first.stderr, /Exported 1 course request/);
  assert.match(await readFile(output, 'utf8'), /test@example.com/);
  assert.equal((await stat(output)).mode & 0o777, 0o600);
  const repeated = spawnSync(process.execPath, [script, '--out', output], options);
  assert.equal(repeated.status, 1);
  assert.match(repeated.stderr, /already exists/);
  const missing = spawnSync(process.execPath, [script], { ...options, env: { ...options.env, DATA_DIR: path.join(directory, 'missing') } });
  assert.equal(missing.status, 1);
  assert.equal(missing.stdout, '');
  assert.match(missing.stderr, /No registration database/);
});

test('the start entry point serves the built website without requiring NODE_ENV to be set', async (t) => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'ibrahim-entry-point-test-'));
  await mkdir(path.join(directory, 'dist'));
  await writeFile(path.join(directory, 'dist', 'index.html'), '<!doctype html><h1>Entry point website</h1>');
  const environment = { ...process.env, PORT: '0', HOST: '127.0.0.1', DATA_DIR: path.join(directory, 'data') };
  delete environment.NODE_ENV;
  const child = spawn(process.execPath, [path.resolve('server/index.mjs')], { cwd: directory, env: environment, stdio: ['ignore', 'pipe', 'pipe'] });
  t.after(async () => {
    if (child.exitCode === null && child.signalCode === null) {
      const exited = once(child, 'exit');
      child.kill('SIGTERM');
      await exited;
    }
    await rm(directory, { recursive: true, force: true });
  });
  const port = await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Entry point did not start in time.')), 5000);
    child.once('error', (error) => { clearTimeout(timeout); reject(error); });
    child.once('exit', () => { clearTimeout(timeout); reject(new Error('Entry point exited before starting.')); });
    let output = '';
    child.stdout.on('data', (chunk) => {
      output += chunk.toString();
      const match = output.match(/listening on port (\d+)/);
      if (match) { clearTimeout(timeout); resolve(Number(match[1])); }
    });
  });
  const response = await fetch(`http://127.0.0.1:${port}`, { headers: { accept: 'text/html' } });
  assert.equal(response.status, 200);
  assert.match(await response.text(), /Entry point website/);
});

test('the real development Vite proxy preserves browser Host and Origin for registration', async (t) => {
  const { base: apiOrigin, db } = await fixture(t);
  const loaded = await loadConfigFromFile({ command: 'serve', mode: 'development' }, path.resolve('vite.config.ts'));
  assert.ok(loaded, 'The development Vite configuration must load.');
  const originalProxy = loaded.config.server?.proxy?.['/api'];
  assert.ok(originalProxy, 'Development requires an API proxy.');
  // Replace only the target port for isolation, retaining the actual proxy
  // shape/options: Vite string targets implicitly enable changeOrigin.
  const isolatedProxy = typeof originalProxy === 'string' ? apiOrigin : { ...originalProxy, target: apiOrigin };
  const vite = await createViteServer({
    ...loaded.config,
    configFile: false,
    logLevel: 'silent',
    server: {
      ...loaded.config.server,
      host: '127.0.0.1',
      port: 0,
      proxy: { ...loaded.config.server.proxy, '/api': isolatedProxy },
    },
  });
  try {
    await vite.listen();
    const browserOrigin = `http://127.0.0.1:${vite.httpServer.address().port}`;
    const options = {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: browserOrigin, 'sec-fetch-site': 'same-origin' },
      body: JSON.stringify({ ...registration, courseId: 'it-service-management' }),
    };
    const response = await fetch(browserOrigin + '/api/registrations', options);
    assert.equal(response.status, 201, await response.clone().text());
    assert.equal((await response.json()).ok, true);
    assert.equal(db.prepare('SELECT COUNT(*) AS count FROM registrations').get().count, 1);
    assert.deepEqual(await (await fetch(browserOrigin + '/api/health')).json(), { ok: true });
    assert.equal((await fetch(apiOrigin + '/api/registrations', options)).status, 403);
    assert.equal((await fetch(browserOrigin + '/api/registrations', { ...options, headers: { ...options.headers, origin: 'https://unrelated.example' } })).status, 403);
    assert.equal(db.prepare('SELECT COUNT(*) AS count FROM registrations').get().count, 1);
  } finally {
    await vite.close();
  }
});
