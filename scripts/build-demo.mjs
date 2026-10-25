import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

// Produce one browser-openable design demo with no server or external requests.
const root = path.resolve("demo-dist");
const output = path.resolve("artifacts/learn-x-demo.html");
const types = {
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".png": "image/png",
};
async function dataUrl(asset) {
  const filename = path.resolve(root, asset.replace(/^\//, ""));
  if (!filename.startsWith(`${root}${path.sep}`))
    throw new Error("Demo asset must stay inside demo-dist.");
  return `data:${types[path.extname(filename)] || "application/octet-stream"};base64,${(await readFile(filename)).toString("base64")}`;
}

let html = await readFile(path.join(root, "index.html"), "utf8");
const scripts = [
  ...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"[^>]*><\/script>/g),
];
if (scripts.length !== 1)
  throw new Error("Expected a single bundled demo script.");
let javascript = await readFile(
  path.join(root, scripts[0][1].replace(/^\//, "")),
  "utf8",
);
const imagePath = "/images/workshop.webp";
if (!javascript.includes(imagePath))
  throw new Error("Demo workshop asset was not found.");
javascript = javascript
  .replaceAll(imagePath, await dataUrl(imagePath))
  .replace(/<\/script/gi, "<\\/script");
html = html.replace(
  scripts[0][0],
  () => `<script type="module">${javascript}</script>`,
);

const stylesheets = [
  ...html.matchAll(/<link\b[^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g),
];
if (!stylesheets.length) throw new Error("Demo styles were not found.");
for (const sheet of stylesheets) {
  let css = await readFile(
    path.join(root, sheet[1].replace(/^\//, "")),
    "utf8",
  );
  for (const match of [
    ...css.matchAll(/url\(["']?(\/assets\/[^)"']+)["']?\)/g),
  ]) {
    css = css.replaceAll(match[0], `url("${await dataUrl(match[1])}")`);
  }
  html = html.replace(
    sheet[0],
    () => `<style>${css.replace(/<\/style/gi, "<\\/style")}</style>`,
  );
}
html = html.replace(
  'href="/favicon.svg"',
  `href="${await dataUrl("/favicon.svg")}"`,
);
html = html.replace("<title>", "<title>Design demo — ");
html = html.replace(
  "<head>",
  `<head><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; font-src data:; img-src data:; connect-src 'none'; form-action 'none'; base-uri 'none'">`,
);
await mkdir(path.dirname(output), { recursive: true });
await writeFile(output, html);
console.log(
  "Created artifacts/learn-x-demo.html — open it directly in a browser. No enrollment data is sent or stored.",
);
