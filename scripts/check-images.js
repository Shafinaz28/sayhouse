const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

function extractPaths(content) {
  const paths = new Set();
  const re = /(?:src|srcset|href)=["']([^"']+)["']/g;
  let m;
  while ((m = re.exec(content))) {
    const s = decodeURIComponent(m[1].split('?')[0]);
    if (/^https?:|data:|#|mailto:|tel:/.test(s)) continue;
    if (/\.(avif|jpe?g|png|webp)$/i.test(s)) paths.add(s);
  }
  return [...paths];
}

function checkFile(htmlFile) {
  const content = fs.readFileSync(path.join(ROOT, htmlFile), 'utf8');
  const broken = [];
  for (const rel of extractPaths(content)) {
    const disk = path.join(ROOT, rel.replace(/\//g, path.sep));
    if (!fs.existsSync(disk)) broken.push({ file: htmlFile, path: rel });
  }
  return broken;
}

const htmlFiles = fs.readdirSync(ROOT).filter((f) => f.endsWith('.html'));
let all = [];
htmlFiles.forEach((f) => {
  all = all.concat(checkFile(f));
});

console.log('Broken image refs:', all.length);
all.slice(0, 40).forEach((b) => console.log(`${b.file}: ${b.path}`));
