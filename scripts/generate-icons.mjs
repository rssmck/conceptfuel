// Pure Node.js PNG icon generator — no npm dependencies
// Run: node scripts/generate-icons.mjs

import { createDeflate } from "zlib";
import { writeFileSync, mkdirSync } from "fs";
import { resolve } from "path";
import { promisify } from "util";
import { deflate } from "zlib";

const deflateAsync = promisify(deflate);
const OUT = resolve("public/icons");
mkdirSync(OUT, { recursive: true });

// Build a minimal PNG with a dark background and white brand mark
// We'll use a 512×512 design with a filled dark square
// Text rendering in raw PNG is complex, so we embed a clean monogram via pixel data

function crc32(buf) {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[i] = c;
  }
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeBytes = Buffer.from(type, "ascii");
  const crcInput = Buffer.concat([typeBytes, data]);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(crcInput));
  return Buffer.concat([len, typeBytes, data, crcBuf]);
}

async function makePng(size, maskable) {
  const bg = [10, 10, 10]; // #0a0a0a
  const fg = [255, 255, 255]; // #ffffff

  // Build raw RGBA rows — simple icon with rounded square shape for maskable
  const rows = [];
  const cx = size / 2;
  const cy = size / 2;
  const radius = maskable ? size * 0.5 : size * 0.5; // maskable: full square
  const innerRadius = maskable ? size * 0.4 : size * 0.38; // rounded bg area

  // We'll draw a "C//" brand mark using simple pixel logic
  // Letter C: arc shape; // marks: two vertical bars
  const fontScale = size / 512;
  const glyphH = Math.round(200 * fontScale);
  const glyphW = Math.round(260 * fontScale);
  const glyphX = Math.round(cx - glyphW / 2);
  const glyphY = Math.round(cy - glyphH / 2);

  // Bar dimensions for "//" slashes
  const barW = Math.round(16 * fontScale);
  const slashGap = Math.round(28 * fontScale);

  function inSlash(px, py, offsetX) {
    // A slash "/" going from bottom-left to top-right
    const relX = px - (glyphX + offsetX);
    const relY = py - glyphY;
    // Slant line: x/width ratio maps to y
    const expectedX = (relY / glyphH) * (-glyphH * 0.5) + (glyphW * 0.25);
    return Math.abs(relX - expectedX) < barW;
  }

  function inC(px, py) {
    const cW = Math.round(120 * fontScale);
    const cH = glyphH;
    const cX = glyphX;
    const cY = glyphY;
    const outerR = cW * 0.5;
    const innerR = outerR - Math.round(22 * fontScale);
    const midX = cX + outerR;
    const midY = cY + cH / 2;
    const dx = px - midX;
    const dy = py - midY;
    const dist = Math.sqrt(dx * dx + dy * dy) / (cH / 2);
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    // C opens to the right: exclude ~60° gap on right side
    const inArc = dist > (innerR / (cH / 2)) && dist < 1.0;
    const inGap = angle > -40 && angle < 40;
    return inArc && !inGap && px >= cX && px <= cX + cW;
  }

  for (let y = 0; y < size; y++) {
    const row = Buffer.alloc(1 + size * 4); // filter byte + RGBA
    row[0] = 0; // None filter
    for (let x = 0; x < size; x++) {
      const isGlyph = inC(x, y)
        || inSlash(x, y, Math.round(140 * fontScale))
        || inSlash(x, y, Math.round(140 * fontScale) + slashGap + barW);
      const [r, g, b] = isGlyph ? fg : bg;
      const i = 1 + x * 4;
      row[i] = r; row[i+1] = g; row[i+2] = b; row[i+3] = 255;
    }
    rows.push(row);
  }

  const rawData = Buffer.concat(rows);
  const compressed = await deflateAsync(rawData, { level: 6 });

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(size, 0);
  ihdrData.writeUInt32BE(size, 4);
  ihdrData[8] = 8;  // bit depth
  ihdrData[9] = 2;  // color type: truecolor (no alpha needed but use RGBA=6)
  ihdrData[9] = 6;  // RGBA
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace

  return Buffer.concat([
    signature,
    chunk("IHDR", ihdrData),
    chunk("IDAT", compressed),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const configs = [
  { name: "icon-192.png",          size: 192, maskable: false },
  { name: "icon-512.png",          size: 512, maskable: false },
  { name: "icon-maskable-192.png", size: 192, maskable: true  },
  { name: "icon-maskable-512.png", size: 512, maskable: true  },
];

for (const { name, size, maskable } of configs) {
  const buf = await makePng(size, maskable);
  writeFileSync(resolve(OUT, name), buf);
  console.log(`✓ ${name} (${buf.length} bytes)`);
}

console.log("\nIcons generated in public/icons/");
