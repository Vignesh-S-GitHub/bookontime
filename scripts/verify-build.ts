import assert from "node:assert/strict";
import { readFile, readdir, access } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const base = "/bookontime/";
const root = path.resolve("dist");
async function assertAsset(url: string) {
  assert.ok(url.startsWith(base), `Asset is outside the Pages base: ${url}`);
  const file = path.resolve(root, url.slice(base.length));
  assert.ok(file.startsWith(root + path.sep), `Invalid asset path: ${url}`);
  await access(file);
}
const manifest = JSON.parse(
  await readFile("dist/manifest.webmanifest", "utf8"),
);
assert.equal(manifest.scope, base);
assert.equal(manifest.start_url, base);
assert.equal(manifest.display, "standalone");
for (const icon of manifest.icons) {
  await assertAsset(base + icon.src);
  const metadata = await sharp(path.join(root, icon.src)).metadata();
  assert.equal(`${metadata.width}x${metadata.height}`, icon.sizes);
}
const html = await readFile("dist/index.html", "utf8");
for (const match of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
  await assertAsset(match[1]);
}
const assets = await readdir("dist/assets");
for (const file of assets.filter((name) => name.endsWith(".css"))) {
  const css = await readFile(path.join(root, "assets", file), "utf8");
  for (const match of css.matchAll(/url\(["']?([^\s)'";]+)["']?\)/g)) {
    if (!match[1].startsWith("data:")) await assertAsset(match[1]);
  }
}
await access("dist/sw.js");
await access("dist/brand-logo.png");
await access("dist/data/holidays/coverage.json");
console.log(
  "PASS: Pages base, manifest, icon dimensions, HTML/CSS/font assets, service worker and holiday data.",
);
