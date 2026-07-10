const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

for (const fileName of fs.readdirSync(ROOT).filter((f) => f.endsWith('.html'))) {
  const filePath = path.join(ROOT, fileName);
  let html = fs.readFileSync(filePath, 'utf8');
  const original = html;
  html = html.replace(
    /<script src="js\/site-navbar\.js"><\/script>\s*<script src="js\/enquiry-popup\.js"><\/script>/g,
    '<script src="js/enquiry-popup.js"></script>\n  <script src="js/site-navbar.js"></script>'
  );
  if (html !== original) {
    fs.writeFileSync(filePath, html, 'utf8');
    console.log('Fixed script order:', fileName);
  }
}
