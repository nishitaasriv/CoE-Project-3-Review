import fs from 'node:fs';
import zlib from 'node:zlib';

function createPNG(size: number, isMaskable = false): Buffer {
  const width = size;
  const height = size;
  const rawData = Buffer.alloc(height * (1 + width * 4));

  const cx = width / 2;
  const cy = height / 2;
  const rOuter = size * 0.38;
  const rInner = size * 0.24;

  let offset = 0;
  for (let y = 0; y < height; y++) {
    rawData[offset++] = 0; // Filter type 0 (None)
    for (let x = 0; x < width; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Default navy background
      let r = 11, g = 17, b = 48, a = 255;

      // Outer ring
      if (dist <= rOuter && dist >= rInner) {
        const factor = (x / width);
        // Purple #7C3AED (124, 58, 237) to Blue #3B82F6 (59, 130, 246)
        r = Math.round(124 * (1 - factor) + 59 * factor);
        g = Math.round(58 * (1 - factor) + 130 * factor);
        b = Math.round(237 * (1 - factor) + 246 * factor);
      } else if (dist < rInner) {
        // Center inner surface
        r = 17; g = 26; b = 64;
      }

      // Small pink accent dot at top-right
      const dotDx = x - (cx + size * 0.26);
      const dotDy = y - (cy - size * 0.26);
      if (Math.sqrt(dotDx * dotDx + dotDy * dotDy) <= size * 0.05) {
        r = 236; g = 72; b = 153; // Pink #EC4899
      }

      rawData[offset++] = r;
      rawData[offset++] = g;
      rawData[offset++] = b;
      rawData[offset++] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData);

  function createChunk(type: string, data: Buffer): Buffer {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crcBuf = Buffer.alloc(4);
    
    // crc32
    let c = 0xffffffff;
    const combined = Buffer.concat([typeBuf, data]);
    for (let i = 0; i < combined.length; i++) {
      c ^= combined[i];
      for (let j = 0; j < 8; j++) {
        c = (c >>> 1) ^ (c & 1 ? 0xedb88320 : 0);
      }
    }
    crcBuf.writeInt32BE(~c, 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // 8 bits per channel
  ihdrData[9] = 6; // RGBA
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;
  const ihdrChunk = createChunk('IHDR', ihdrData);
  const idatChunk = createChunk('IDAT', compressed);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

if (!fs.existsSync('./public')) {
  fs.mkdirSync('./public', { recursive: true });
}

fs.writeFileSync('./public/pwa-192x192.png', createPNG(192));
fs.writeFileSync('./public/pwa-512x512.png', createPNG(512));
fs.writeFileSync('./public/pwa-maskable-512x512.png', createPNG(512, true));
fs.writeFileSync('./public/apple-touch-icon.png', createPNG(180));
fs.writeFileSync('./public/favicon.ico', createPNG(64));
console.log('PWA icons generated successfully.');
