import { createApp } from './app.mjs';

const port = Number(process.env.PORT || 3001);
if (!Number.isInteger(port) || port < 0 || port > 65535) {
  throw new Error('PORT must be an integer from 0 through 65535.');
}
const trustProxy = process.env.TRUST_PROXY === '1' ? 1 : false;
// `npm start` always serves the build as documented. In development Vite only
// proxies /api, so this also works when the build has not been generated yet.
const { app, close } = createApp({ trustProxy, serveStatic: true });
const server = app.listen(port, process.env.HOST || '0.0.0.0', () => {
  console.log(`Course website server listening on port ${server.address().port}.`);
});
server.on('error', (error) => {
  console.error(`Server failed to start: ${error.code || 'unknown error'}.`);
  close();
  process.exitCode = 1;
});
let shuttingDown = false;
function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;
  server.close(() => {
    close();
    process.exitCode = 0;
  });
  const timeout = setTimeout(() => process.exit(1), 10000);
  timeout.unref();
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
