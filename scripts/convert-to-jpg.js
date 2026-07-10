/**
 * Convert PNG/WebP project images to JPG (keeps originals).
 * Run: npm run convert:jpg
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..');
const FOLDERS = ['images', 'interior', 'commercial', 'residentail images'];
const EXT = /\.(png|webp)$/i;
const CONCURRENCY = 6;

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (EXT.test(entry.name)) out.push(full);
  }
  return out;
}

async function convertOne(file) {
  const jpg = file.replace(EXT, '.jpg');
  if (fs.existsSync(jpg)) {
    const srcMtime = fs.statSync(file).mtimeMs;
    const jpgMtime = fs.statSync(jpg).mtimeMs;
    if (jpgMtime >= srcMtime) return 'skip';
  }

  await sharp(file).jpeg({ quality: 88, mozjpeg: true }).toFile(jpg);
  return 'ok';
}

async function runPool(items, worker) {
  let index = 0;
  const results = { ok: 0, skip: 0, err: 0 };

  async function next() {
    while (index < items.length) {
      const i = index++;
      try {
        const status = await worker(items[i]);
        results[status === 'skip' ? 'skip' : 'ok']++;
      } catch (err) {
        results.err++;
        console.warn('Failed:', items[i], err.message);
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, next));
  return results;
}

async function main() {
  const files = FOLDERS.flatMap((folder) => walk(path.join(ROOT, folder)));
  console.log(`Converting ${files.length} PNG/WebP images to JPG...`);
  const results = await runPool(files, convertOne);
  console.log('Done:', results);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
