const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PAGES = fs
  .readdirSync(ROOT)
  .filter((f) => f.endsWith('.html') && f !== 'admin-project-form.html');

const NAV_BLOCK_RE =
  /\n\s*const navbar = document\.getElementById\('navbar'\);[\s\S]*?mobileMenu\.querySelectorAll\('a'\)\.forEach\([\s\S]*?\}\);\s*\}\);\s*/g;

for (const fileName of PAGES) {
  const filePath = path.join(ROOT, fileName);
  let html = fs.readFileSync(filePath, 'utf8');
  const before = html;
  html = html.replace(NAV_BLOCK_RE, '\n');
  if (html !== before) {
    fs.writeFileSync(filePath, html, 'utf8');
    console.log('Removed duplicate navbar JS from', fileName);
  }
}
