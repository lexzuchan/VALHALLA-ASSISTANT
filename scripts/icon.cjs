// Original VALHALLA emblem, rasterized without external artwork or dependencies.
const fs = require('node:fs'),
  path = require('node:path'),
  zlib = require('node:zlib');
const root = path.join(__dirname, '../build');
fs.mkdirSync(root, { recursive: true });
function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const name = Buffer.from(type),
    length = Buffer.alloc(4),
    crc = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  crc.writeUInt32BE(crc32(Buffer.concat([name, data])));
  return Buffer.concat([length, name, data, crc]);
}
function segmentDistance(x, y, ax, ay, bx, by) {
  const dx = bx - ax,
    dy = by - ay,
    t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(x - ax - t * dx, y - ay - t * dy);
}
function png(size) {
  const stride = size * 4 + 1,
    raw = Buffer.alloc(stride * size);
  const segments = [
    [0.25, 0.24, 0.5, 0.78],
    [0.5, 0.78, 0.75, 0.24],
    [0.25, 0.24, 0.75, 0.24],
    [0.25, 0.24, 0.5, 0.4],
    [0.5, 0.4, 0.75, 0.24],
    [0.5, 0.4, 0.5, 0.78],
  ];
  for (let y = 0; y < size; y++) {
    raw[y * stride] = 0;
    for (let x = 0; x < size; x++) {
      let r = 0,
        g = 0,
        b = 0;
      for (let sy = 0; sy < 2; sy++)
        for (let sx = 0; sx < 2; sx++) {
          const u = (x + (sx + 0.5) / 2) / size,
            v = (y + (sy + 0.5) / 2) / size;
          const d = Math.min(...segments.map((s) => segmentDistance(u, v, ...s))),
            glow = Math.exp(-d * 32) * 0.14;
          const edge = Math.max(0, Math.min(1, ((0.017 - d) * size) / 2 + 0.5));
          const mix = edge * 0.95 + glow * (1 - edge);
          r += 8 + (121 - 8) * mix;
          g += 17 + (228 - 17) * mix;
          b += 24 + (224 - 24) * mix;
        }
      const offset = y * stride + 1 + x * 4;
      raw[offset] = r / 4;
      raw[offset + 1] = g / 4;
      raw[offset + 2] = b / 4;
      raw[offset + 3] = 255;
    }
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size);
  header.writeUInt32BE(size, 4);
  header[8] = 8;
  header[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', header),
    chunk('IDAT', zlib.deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}
const sizes = [16, 32, 48, 64, 128, 256],
  images = sizes.map(png),
  header = Buffer.alloc(6 + 16 * sizes.length);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(sizes.length, 4);
let offset = header.length;
images.forEach((image, i) => {
  const pos = 6 + i * 16;
  header[pos] = sizes[i] === 256 ? 0 : sizes[i];
  header[pos + 1] = header[pos];
  header.writeUInt16LE(1, pos + 4);
  header.writeUInt16LE(32, pos + 6);
  header.writeUInt32LE(image.length, pos + 8);
  header.writeUInt32LE(offset, pos + 12);
  offset += image.length;
});
fs.writeFileSync(path.join(root, 'icon.ico'), Buffer.concat([header, ...images]));
fs.writeFileSync(path.join(root, 'icon.png'), png(256));
console.log('VALHALLA app icons generated.');
