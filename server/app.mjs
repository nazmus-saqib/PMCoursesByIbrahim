import express from 'express';
import { DatabaseSync } from 'node:sqlite';
import { createHash, randomUUID } from 'node:crypto';
import { chmodSync, existsSync, mkdirSync, realpathSync } from 'node:fs';
import path from 'node:path';

export const COURSE_IDS = Object.freeze([
  'project-management',
  'agile',
  'prince2',
  'it-service-management',
]);

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function resolveRealPath(target) {
  const absolute = path.resolve(target);
  if (existsSync(absolute)) return realpathSync(absolute);
  const parent = path.dirname(absolute);
  return parent === absolute ? absolute : path.join(resolveRealPath(parent), path.basename(absolute));
}

function isWithin(directory, root) {
  const relative = path.relative(root, directory);
  return !relative || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative));
}

function validateRegistration(body) {
  const errors = {};
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { errors: { form: 'Please send a valid registration form.' } };
  }

  const text = (key, max, required = false) => {
    const value = body[key];
    if (value === undefined || value === null) {
      if (required) errors[key] = 'This field is required.';
      return '';
    }
    if (typeof value !== 'string') {
      errors[key] = 'Please enter text.';
      return '';
    }
    const clean = value.trim();
    if (required && !clean) errors[key] = 'This field is required.';
    else if (clean.length > max) errors[key] = `Please use ${max} characters or fewer.`;
    else if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(clean)) {
      errors[key] = 'Please remove unsupported characters.';
    }
    return clean;
  };

  const values = {
    name: text('name', 120, true),
    email: text('email', 254, true).toLowerCase(),
    courseId: text('courseId', 60, true),
    cohortId: text('cohortId', 120),
    phone: text('phone', 40),
    goal: text('goal', 2000),
  };
  if (values.name && values.name.length < 2) errors.name = 'Please enter your full name.';
  if (values.email && !emailPattern.test(values.email)) errors.email = 'Please enter a valid email address.';
  if (!COURSE_IDS.includes(values.courseId)) errors.courseId = 'Please choose one of the available courses.';
  if (body.consent !== true) errors.consent = 'Please agree to being contacted about this course.';
  return { values, errors };
}

/** Creates an isolated application; callers must close() its SQLite connection. */
export function createApp({
  dataDir = process.env.DATA_DIR || path.resolve('data'),
  distDir = path.resolve('dist'),
  publicDir = path.resolve('public'),
  serveStatic = process.env.NODE_ENV === 'production',
  rateLimitMax = 12,
  rateLimitWindowMs = 15 * 60 * 1000,
  trustProxy = false,
} = {}) {
  // Vite serves public/ without applying fs.deny, and production serves dist/.
  // Never allow registration files to be created under either public tree.
  const resolvedDataDir = resolveRealPath(dataDir);
  if ([publicDir, distDir].some((directory) => isWithin(resolvedDataDir, resolveRealPath(directory)))) {
    throw new Error('DATA_DIR must be outside public/ and dist/ so course requests remain private.');
  }
  mkdirSync(dataDir, { recursive: true, mode: 0o700 });
  const databasePath = path.join(dataDir, 'registrations.sqlite');
  const db = new DatabaseSync(databasePath);
  chmodSync(databasePath, 0o600);
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA busy_timeout = 5000;
    CREATE TABLE IF NOT EXISTS registrations (
      id TEXT PRIMARY KEY,
      fingerprint TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      course_id TEXT NOT NULL,
      cohort_id TEXT NOT NULL DEFAULT '',
      phone TEXT NOT NULL DEFAULT '',
      goal TEXT NOT NULL DEFAULT '',
      consent_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending'
    );
  `);

  const insertRegistration = db.prepare(`
    INSERT INTO registrations (id, fingerprint, name, email, course_id, cohort_id, phone, goal, consent_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(fingerprint) DO NOTHING
  `);
  const findRegistration = db.prepare('SELECT id FROM registrations WHERE fingerprint = ?');

  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', trustProxy);
  app.use((_request, response, next) => {
    response.set({
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
      'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self'; form-action 'self'; base-uri 'self'; frame-ancestors 'none'; object-src 'none'",
    });
    next();
  });

  app.use('/api', (_request, response, next) => {
    response.set('Cache-Control', 'no-store');
    next();
  });
  app.get('/api/health', (_request, response) => response.json({ ok: true }));

  const buckets = new Map();
  function rateLimit(request, response, next) {
    const now = Date.now();
    // Remove expired entries on access so the limiter does not retain client data.
    for (const [key, value] of buckets) {
      if (value.resetAt <= now) buckets.delete(key);
    }
    const key = request.ip || request.socket.remoteAddress || 'unknown';
    const bucket = buckets.get(key) || { count: 0, resetAt: now + rateLimitWindowMs };
    bucket.count += 1;
    buckets.set(key, bucket);
    if (bucket.count > rateLimitMax) {
      response.set('Retry-After', String(Math.max(1, Math.ceil((bucket.resetAt - now) / 1000))));
      return response.status(429).json({ ok: false, error: 'Too many requests. Please try again in a few minutes.' });
    }
    next();
  }

  app.post('/api/registrations', rateLimit, (request, response, next) => {
    const origin = request.get('origin');
    if (request.get('sec-fetch-site') === 'cross-site') {
      return response.status(403).json({ ok: false, error: 'Please submit this form from this website.' });
    }
    if (origin) {
      try {
        const parsed = new URL(origin);
        if (!['http:', 'https:'].includes(parsed.protocol) || parsed.host !== request.get('host')) {
          return response.status(403).json({ ok: false, error: 'Please submit this form from this website.' });
        }
      } catch {
        return response.status(403).json({ ok: false, error: 'Please submit this form from this website.' });
      }
    }
    if (!request.is('application/json')) {
      return response.status(415).json({ ok: false, error: 'Please submit the registration form as JSON.' });
    }
    next();
  }, express.json({ limit: '16kb' }), (request, response) => {
    if (request.body && typeof request.body.website === 'string' && request.body.website.trim()) {
      // Do not store automated submissions or reveal the honeypot check.
      return response.status(201).json({ ok: true, reference: randomUUID(), message: 'Your request has been received.' });
    }
    const { values, errors } = validateRegistration(request.body);
    if (Object.keys(errors).length) {
      return response.status(400).json({ ok: false, error: 'Please check the highlighted fields.', fieldErrors: errors });
    }
    try {
      const fingerprint = createHash('sha256').update(JSON.stringify([values.email, values.courseId, values.cohortId])).digest('hex');
      const now = new Date().toISOString();
      insertRegistration.run(randomUUID(), fingerprint, values.name, values.email, values.courseId, values.cohortId, values.phone, values.goal, now, now);
      const registration = findRegistration.get(fingerprint);
      return response.status(201).json({
        ok: true,
        reference: registration.id,
        message: 'Your course request is recorded. Your place is not confirmed yet; course dates, availability, and next steps still need to be confirmed.',
      });
    } catch {
      // Avoid logging request payloads or database errors containing personal data.
      console.error('Unable to save a course request. Check the data directory and database.');
      return response.status(503).json({ ok: false, error: 'We could not save your request. Please try again shortly.' });
    }
  });

  app.use('/api', (_request, response) => response.status(404).json({ ok: false, error: 'This API endpoint does not exist.' }));

  if (serveStatic) {
    app.use(express.static(distDir, { index: false, maxAge: '1h' }));
    app.use((request, response, next) => {
      if (!['GET', 'HEAD'].includes(request.method) || !request.accepts('html') || path.extname(request.path)) return next();
      const indexFile = path.join(distDir, 'index.html');
      if (!existsSync(indexFile)) {
        return response.status(503).type('text').send('Website build unavailable. Run npm run build before starting the server.');
      }
      response.set('Cache-Control', 'no-cache').sendFile(indexFile);
    });
  }
  app.use((_request, response) => response.status(404).json({ ok: false, error: 'Page not found.' }));
  app.use((error, _request, response, _next) => {
    if (error.type === 'entity.too.large') {
      return response.status(413).json({ ok: false, error: 'The form is too large. Please shorten your message.' });
    }
    if (error instanceof SyntaxError && error.status === 400) {
      return response.status(400).json({ ok: false, error: 'The form could not be read. Please try again.' });
    }
    console.error('An unexpected server error occurred.');
    return response.status(500).json({ ok: false, error: 'Something went wrong. Please try again shortly.' });
  });

  return { app, db, databasePath, close: () => db.close() };
}
