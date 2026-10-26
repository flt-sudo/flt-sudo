/** Generates the PWA / apple-touch icons (gradient tile with a play glyph) without image dependencies. */
import fs from "node:fs";
import zlib from "node:zlib";

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf: Buffer) => {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff]! ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type: string, data: Buffer) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
};

function icon(size: number): Buffer {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  const cx = size / 2;
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      const t = (x + y) / (2 * size);
      let r = Math.round(255 * (1 - t) + 255 * t);
      let g = Math.round(61 * (1 - t) + 138 * t);
      let b = Math.round(87 * (1 - t) + 92 * t);
      // Play triangle centred, pointing right.
      const px = (x - cx) / size;
      const py = (y - cx) / size;
      const inTri = px > -0.16 && px < 0.22 && Math.abs(py) < (0.22 - px) * 0.75;
      // Ring
      const d = Math.hypot(px, py);
      const inRing = d > 0.33 && d < 0.37;
      if (inTri || inRing) r = g = b = 255;
      const o = y * (size * 4 + 1) + 1 + x * 4;
      raw[o] = r;
      raw[o + 1] = g;
      raw[o + 2] = b;
      raw[o + 3] = 255;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]);
}

fs.mkdirSync("web/public/icons", { recursive: true });
for (const s of [180, 192, 512]) fs.writeFileSync(`web/public/icons/icon-${s}.png`, icon(s));
console.log("icons written");
