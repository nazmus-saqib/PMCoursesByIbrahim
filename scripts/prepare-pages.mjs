import { copyFile, mkdir, writeFile } from 'node:fs/promises';

await mkdir('docs', { recursive: true });
await copyFile('artifacts/learn-x-demo.html', 'docs/index.html');
await writeFile('docs/.nojekyll', '');
console.log('Prepared GitHub Pages demo in docs/. Enrollment submissions remain disabled.');
