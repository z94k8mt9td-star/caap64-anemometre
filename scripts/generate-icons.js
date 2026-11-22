/* Generates the app icon assets (pure Node, no dependencies).
   Usage: node scripts/generate-icons.js */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function crc32(buf) {
  if (!crc32.table) {
    crc32.table = new Int32Array(256).map((_, n) => {
      let c = n;
      for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      return c;
    });
  }
  let c = -1;
  for (let i = 0; i < buf.length; i += 1) c = (c >>> 8) ^ crc32.table[(c ^ buf[i]) & 0xff];
  return (c ^ -1) >>> 0;
}

function chunk(type, data) {
  const out = Buffer.alloc(8 + data.length + 4);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, 'ascii');
  data.copy(out, 8);
  out.writeUInt32BE(crc32(Buffer.concat([Buffer.from(type, 'ascii'), data])), 8 + data.length);
  return out;
}

function encodePNG(width, height, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y += 1) {
    raw[y * (width * 4 + 1)] = 0;
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}

function pointInPolygon(x, y, poly) {
  let inside = false;
  for (let i = 0; i < poly.length; i += 1) {
    const [x1, y1] = poly[i];
    const [x2, y2] = poly[(i + 1) % poly.length];
    if (y1 > y !== y2 > y && x < ((x2 - x1) * (y - y1)) / (y2 - y1) + x1) inside = !inside;
  }
  return inside;
}

const ARROW = [
  [0.5, 0.24],
  [0.43, 0.64],
  [0.5, 0.58],
  [0.57, 0.64],
];
const RING_R = 0.3;
const RING_T = 0.032;
const DOT_R = 0.035;

function glyph(nx, ny, scale) {
  const x = 0.5 + (nx - 0.5) * scale;
  const y = 0.5 + (ny - 0.5) * scale;
  const dx = x - 0.5;
  const dy = y - 0.5;
  const d = Math.hypot(dx, dy);
  if (d <= DOT_R) return 'dot';
  if (Math.abs(d - RING_R) <= RING_T / 2) return 'ring';
  if (pointInPolygon(x, y, ARROW)) return 'arrow';
  return null;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function render(size, painter) {
  const ss = 2;
  const big = size * ss;
  const raw = Buffer.alloc(big * big * 4);
  for (let y = 0; y < big; y += 1) {
    for (let x = 0; x < big; x += 1) {
      const [r, g, b, a] = painter(x / big, y / big);
      const o = (y * big + x) * 4;
      raw[o] = r;
      raw[o + 1] = g;
      raw[o + 2] = b;
      raw[o + 3] = a;
    }
  }
  const out = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;
      for (let dy = 0; dy < ss; dy += 1) {
        for (let dx = 0; dx < ss; dx += 1) {
          const o = ((y * ss + dy) * big + (x * ss + dx)) * 4;
          r += raw[o];
          g += raw[o + 1];
          b += raw[o + 2];
          a += raw[o + 3];
        }
      }
      const n = ss * ss;
      const oo = (y * size + x) * 4;
      out[oo] = Math.round(r / n);
      out[oo + 1] = Math.round(g / n);
      out[oo + 2] = Math.round(b / n);
      out[oo + 3] = Math.round(a / n);
    }
  }
  return encodePNG(size, size, out);
}

const BG_TOP = [27, 58, 107];
const BG_BOTTOM = [10, 17, 32];
const GLYPH = [125, 211, 252];
const RING = [232, 238, 249];

function iconPainter(nx, ny) {
  const t = ny;
  const bg = [lerp(BG_TOP[0], BG_BOTTOM[0], t), lerp(BG_TOP[1], BG_BOTTOM[1], t), lerp(BG_TOP[2], BG_BOTTOM[2], t)];
  const g = glyph(nx, ny, 1);
  if (g === 'arrow') return [56, 189, 248, 255];
  if (g === 'ring') return [RING[0], RING[1], RING[2], 255];
  if (g === 'dot') return [232, 238, 249, 255];
  return [bg[0], bg[1], bg[2], 255];
}

function foregroundPainter(color) {
  return (nx, ny) => {
    const g = glyph(nx, ny, 0.66);
    if (g === 'arrow') return [...color, 255];
    if (g === 'ring') return [...color, 255];
    if (g === 'dot') return [...color, 255];
    return [0, 0, 0, 0];
  };
}

function solidPainter(color) {
  return () => [...color, 255];
}

const outDir = path.join(__dirname, '..', 'assets');
fs.mkdirSync(outDir, { recursive: true });

const files = {
  'icon.png': render(1024, iconPainter),
  'android-icon-foreground.png': render(1024, foregroundPainter(GLYPH)),
  'android-icon-monochrome.png': render(1024, foregroundPainter([255, 255, 255])),
  'android-icon-background.png': render(1024, solidPainter(BG_BOTTOM)),
  'splash-icon.png': render(1024, foregroundPainter(GLYPH)),
  'favicon.png': render(48, iconPainter),
};

for (const [name, buf] of Object.entries(files)) {
  fs.writeFileSync(path.join(outDir, name), buf);
  console.log(`wrote assets/${name} (${buf.length} bytes)`);
}
