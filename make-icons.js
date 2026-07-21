// Generates minimal icon files for Tauri build (no external dependencies)
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

function makePNG(size, r, g, b) {
  const rowBytes = size * 4 + 1;
  const raw = Buffer.alloc(size * rowBytes);
  for (let y = 0; y < size; y++) {
    raw[y * rowBytes] = 0; // filter: None
    for (let x = 0; x < size; x++) {
      const i = y * rowBytes + 1 + x * 4;
      raw[i] = r; raw[i+1] = g; raw[i+2] = b; raw[i+3] = 255;
    }
  }
  const deflated = zlib.deflateSync(raw);

  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    table[i] = c >>> 0;
  }
  function crc32(buf) {
    let crc = 0xFFFFFFFF;
    for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
    return (crc ^ 0xFFFFFFFF) >>> 0;
  }
  function chunk(type, data) {
    const tb = Buffer.from(type);
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const crcBuf = Buffer.alloc(4); crcBuf.writeUInt32BE(crc32(Buffer.concat([tb, data])));
    return Buffer.concat([len, tb, data, crcBuf]);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6; // RGBA
  return Buffer.concat([
    Buffer.from([137,80,78,71,13,10,26,10]),
    chunk('IHDR', ihdr), chunk('IDAT', deflated), chunk('IEND', Buffer.alloc(0))
  ]);
}

function makeICO(sizes, r, g, b) {
  const pngs = sizes.map(s => makePNG(s, r, g, b));
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(sizes.length, 4);
  let offset = 6 + 16 * sizes.length;
  const entries = pngs.map((png, i) => {
    const s = sizes[i];
    const e = Buffer.alloc(16);
    e[0] = s >= 256 ? 0 : s; e[1] = s >= 256 ? 0 : s;
    e.writeUInt16LE(1, 4); e.writeUInt16LE(32, 6);
    e.writeUInt32LE(png.length, 8); e.writeUInt32LE(offset, 12);
    offset += png.length;
    return e;
  });
  return Buffer.concat([header, ...entries, ...pngs]);
}

const dir = path.join(__dirname, 'src-tauri', 'icons');
fs.mkdirSync(dir, { recursive: true });

// Space Power orange: #ff4400
const [R, G, B] = [0xff, 0x44, 0x00];

fs.writeFileSync(path.join(dir, '32x32.png'),      makePNG(32,  R, G, B));
fs.writeFileSync(path.join(dir, '128x128.png'),    makePNG(128, R, G, B));
fs.writeFileSync(path.join(dir, '128x128@2x.png'), makePNG(256, R, G, B));
fs.writeFileSync(path.join(dir, 'icon.png'),       makePNG(512, R, G, B));
fs.writeFileSync(path.join(dir, 'icon.ico'), makeICO([16, 32, 48, 256], R, G, B));

// Tauri on non-macOS doesn't need icon.icns but we create an empty placeholder
// so the config doesn't break cross-platform builds
fs.writeFileSync(path.join(dir, 'icon.icns'), Buffer.alloc(0));

console.log('Icons created in src-tauri/icons/');
