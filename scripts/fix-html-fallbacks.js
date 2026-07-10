const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

function fixContent(content) {
  return content
    .replace(/src="logo\/([^"]+)\.avif"/g, 'src="logo/$1.png"')
    .replace(/src="images\/logo\.avif"/g, 'src="images/logo.png"')
    .replace(/href="images\/favicon\.avif"/g, 'href="images/favicon.png"')
    .replace(/type="image\/avif" href="images\/favicon\.png"/g, 'type="image/png" href="images/favicon.png"')
    .replace(/src="([^"]+)\.avif"/g, (match, base) => {
      if (base.includes('logo/') || base.endsWith('logo')) return match.replace('.avif', '.png');
      return `src="${base}.jpg"`;
    });
}

fs.readdirSync(ROOT)
  .filter((f) => f.endsWith('.html'))
  .forEach((file) => {
    const full = path.join(ROOT, file);
    const original = fs.readFileSync(full, 'utf8');
    const updated = fixContent(original);
    if (updated !== original) {
      fs.writeFileSync(full, updated);
      console.log('Updated', file);
    }
  });

console.log('HTML image fallbacks restored.');
