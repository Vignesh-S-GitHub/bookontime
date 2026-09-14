import sharp from "sharp";
import { copyFile, mkdir } from "node:fs/promises";
await copyFile(
  "design/reference/bookontime-ticket-clock-logo_2.png",
  "public/brand-logo.png",
);
await mkdir("public/icons", { recursive: true });
for (const size of [192, 512])
  await sharp("design/reference/bookontime-ticket-clock-logo.png")
    .resize(size, size)
    .png()
    .toFile(`public/icons/icon-${size}.png`);
await sharp("design/reference/bookontime-ticket-clock-logo.png")
  .resize(512, 512)
  .png()
  .toFile("public/icons/maskable-512.png");
await sharp("design/reference/pastel-blue-travel-journey-background.png")
  .resize({ width: 1000 })
  .webp({ quality: 80 })
  .toFile("public/journey-background.webp");
