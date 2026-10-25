import { DatabaseSync } from 'node:sqlite';
import { existsSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const columns = ['id', 'name', 'email', 'course_id', 'cohort_id', 'phone', 'goal', 'status', 'created_at', 'consent_at'];

/** Quoted CSV, with spreadsheet formula execution disabled for user-entered values. */
export function csvCell(value) {
  let text = String(value ?? '');
  if (/^[\s]*[=+@-]/u.test(text) || /^[\t\r\n]/u.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

export function exportRegistrations({ dataDir = process.env.DATA_DIR || path.resolve('data'), output } = {}) {
  const databasePath = path.join(dataDir, 'registrations.sqlite');
  if (!existsSync(databasePath)) throw new Error('No registration database found. Start the server with the correct DATA_DIR first.');
  const db = new DatabaseSync(databasePath, { readOnly: true });
  try {
    const rows = db.prepare(`SELECT ${columns.join(', ')} FROM registrations ORDER BY created_at`).all();
    const csv = [columns.map(csvCell).join(','), ...rows.map((row) => columns.map((column) => csvCell(row[column])).join(','))].join('\r\n') + '\r\n';
    if (output) {
      writeFileSync(output, csv, { encoding: 'utf8', mode: 0o600, flag: 'wx' });
    }
    return { csv, count: rows.length };
  } finally {
    db.close();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const args = process.argv.slice(2);
  if (args.includes('--help') || args.includes('-h')) {
    console.log('Usage: node server/export-registrations.mjs [--out /secure/path/registrations.csv]\nReads DATA_DIR/registrations.sqlite (default: ./data). Without --out, CSV is printed to stdout.\nKeep exports private: they contain learners’ personal information. Existing files are never overwritten.');
  } else if (args.length && (args.length !== 2 || args[0] !== '--out' || !args[1])) {
    console.error('Usage: node server/export-registrations.mjs [--out /secure/path/registrations.csv]');
    process.exitCode = 1;
  } else {
    try {
      const output = args[1];
      const { csv, count } = exportRegistrations({ output });
      if (output) console.error(`Exported ${count} course request(s). Keep this file private.`);
      else process.stdout.write(csv);
    } catch (error) {
      if (error.code === 'EEXIST') console.error('Export refused: that file already exists. Choose a new private file path.');
      else if (error.code === 'ENOENT') console.error('Export failed: the output directory does not exist. Choose an existing private directory.');
      else console.error(error.message === 'No registration database found. Start the server with the correct DATA_DIR first.' ? error.message : 'Export failed. Check DATA_DIR, database access, and output permissions.');
      process.exitCode = 1;
    }
  }
}
