import sharp from "sharp";
import { mkdir } from "node:fs/promises";
const res = "android/app/src/main/res";
// Extract the approved ticket/clock mark; never synthesize a replacement logo.
const cropped = await sharp("public/brand-logo.png")
  .extract({ left: 300, top: 250, width: 650, height: 510 })
  .png()
  .toBuffer();
const mark = await sharp(cropped).trim().png().toBuffer();
for (const [density, size] of [
  ["mdpi", 48],
  ["hdpi", 72],
  ["xhdpi", 96],
  ["xxhdpi", 144],
  ["xxxhdpi", 192],
] as const) {
  const dir = `${res}/mipmap-${density}`;
  await mkdir(dir, { recursive: true });
  const icon = await sharp(mark)
    .resize(Math.round(size * 0.75), Math.round(size * 0.75), {
      fit: "contain",
      background: "#FFFFFF",
    })
    .png()
    .toBuffer();
  for (const name of ["ic_launcher", "ic_launcher_round"])
    await sharp({
      create: { width: size, height: size, channels: 4, background: "#FFFFFF" },
    })
      .composite([{ input: icon, gravity: "centre" }])
      .png()
      .toFile(`${dir}/${name}.png`);
  const foregroundSize = Math.round(size * 2.25);
  const foreground = await sharp(mark)
    .resize(
      Math.round(foregroundSize * 0.58),
      Math.round(foregroundSize * 0.58),
      { fit: "contain", background: "#FFFFFF" },
    )
    .png()
    .toBuffer();
  await sharp({
    create: {
      width: foregroundSize,
      height: foregroundSize,
      channels: 4,
      background: "#FFFFFF",
    },
  })
    .composite([{ input: foreground, gravity: "centre" }])
    .png()
    .toFile(`${dir}/ic_launcher_foreground.png`);
}
console.log("Prepared Android launcher icons from the approved logo.");
