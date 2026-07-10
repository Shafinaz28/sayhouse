/**
 * Convert JPG/PNG project images to AVIF (keeps originals as fallback).
 * Run: node scripts/convert-to-avif.js
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..');
const FOLDERS = ['images', 'interior', 'commercial', 'residentail images'];
const EXT = /\.(jpe?g|png)$/i;
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
  const avif = file.replace(EXT, '.avif');
  if (fs.existsSync(avif)) {
    const srcMtime = fs.statSync(file).mtimeMs;
    const avifMtime = fs.statSync(avif).mtimeMs;
    if (avifMtime >= srcMtime) return 'skip';
  }

  await sharp(file).avif({ quality: 62, effort: 4 }).toFile(avif);
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
        if ((results.ok + results.skip) % 40 === 0) {
          console.log(`Progress: ${results.ok + results.skip}/${items.length}`);
        }
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
  console.log(`Converting ${files.length} images to AVIF...`);
  const results = await runPool(files, convertOne);
  console.log('Done:', results);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
