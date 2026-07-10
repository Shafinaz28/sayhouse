const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const dataFiles = [
  'js/building-projects-data.js',
  'js/interior-projects-data.js',
  'js/commercial-sectors.js',
];

function pathsFromJs(content) {
  const set = new Set();
  const re = /['"]([^'"]+\.(?:avif|jpe?g|png|webp))['"]/gi;
  let m;
  while ((m = re.exec(content))) {
    let p = m[1].replace(/^\.\//, '');
    if (p.includes('%20') || p.includes('images/') || p.includes('interior/') || p.includes('commercial/') || p.includes('residentail')) {
      set.add(decodeURIComponent(p));
    }
  }
  return [...set];
}

let missing = [];
dataFiles.forEach((file) => {
  const content = fs.readFileSync(path.join(ROOT, file), 'utf8');
  pathsFromJs(content).forEach((rel) => {
    const disk = path.join(ROOT, rel.replace(/\//g, path.sep));
    if (!fs.existsSync(disk)) {
      const jpg = rel.replace(/\.avif$/i, '.jpg');
      const jpgDisk = path.join(ROOT, jpg.replace(/\//g, path.sep));
      missing.push({ file, path: rel, jpgExists: fs.existsSync(jpgDisk) });
    }
  });
});

console.log('Missing AVIF in data files:', missing.length);
missing.slice(0, 30).forEach((m) => console.log(`${m.file}: ${m.path} (jpg fallback: ${m.jpgExists})`));
