import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = path.join(__dirname, '..', 'packages.html');
const outDir = path.join(__dirname, '..', 'google-sheet-import');

function decodeHtml(str) {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function csvEscape(val) {
  const s = String(val ?? '');
  if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function csvRow(cols) {
  return cols.map(csvEscape).join(',');
}

function extractCardHtml(block) {
  const marker = '<div class="package-card">';
  const start = block.indexOf(marker);
  if (start === -1) return '';
  let depth = 1;
  let i = start + marker.length;
  while (i < block.length) {
    const open = block.indexOf('<div', i);
    const close = block.indexOf('</div>', i);
    if (close === -1) break;
    if (open !== -1 && open < close) {
      depth += 1;
      i = open + 4;
    } else {
      depth -= 1;
      i = close + 6;
      if (depth === 0) return block.slice(start + marker.length, close);
    }
  }
  return '';
}

const html = fs.readFileSync(htmlPath, 'utf8');
const gridStart = html.indexOf('<div class="packages-grid" id="packagesGrid">');
const gridEnd = html.indexOf('</div>\n      </div>\n    </div>\n  </section>', gridStart);
const gridHtml = html.slice(gridStart, gridEnd);
const parts = gridHtml.split(/<div class="package-column reveal d\d">/).slice(1);

const sectionRe =
  /<details class="package-detail"[^>]*>[\s\S]*?<summary class="package-summary">\s*([\s\S]*?)<i class="fa-solid[\s\S]*?<div class="package-detail-body">([\s\S]*?)<\/div>\s*<\/details>/g;
const lineRe = /<p class="detail-line">([\s\S]*?)<\/p>/g;

const headers = [
  'Package Name',
  'Old Price',
  'New Price',
  'Sort Order',
  'Show',
  'Section Title',
  'Section Sort',
  'Details',
];
const rows = [headers];

parts.forEach((block, index) => {
  const name = block.match(/<span class="plan-name">([^<]+)<\/span>/)?.[1];
  const oldPrice = block.match(/class="old-price">₹([^<]+)<\/span>/)?.[1]?.trim();
  const newPrice = block.match(/class="new-price">₹([^<]+)<\/span>/)?.[1]?.trim();
  const cardHtml = extractCardHtml(block);
  if (!name || !cardHtml) return;

  const pkgName = decodeHtml(name);
  const packageSort = String(index + 1);
  let si = 0;
  let sm;
  sectionRe.lastIndex = 0;
  while ((sm = sectionRe.exec(cardHtml)) !== null) {
    si += 1;
    const title = decodeHtml(sm[1].replace(/<[^>]+>/g, ''));
    const details = [];
    let lm;
    lineRe.lastIndex = 0;
    while ((lm = lineRe.exec(sm[2])) !== null) {
      details.push(decodeHtml(lm[1].replace(/<[^>]+>/g, '')));
    }
    rows.push([
      pkgName,
      oldPrice,
      newPrice,
      packageSort,
      'YES',
      title,
      String(si),
      details.join('\n'),
    ]);
  }
});

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'Packages.csv'), rows.map(csvRow).join('\r\n'), 'utf8');
console.log(`Wrote ${rows.length - 1} rows to Packages.csv`);
