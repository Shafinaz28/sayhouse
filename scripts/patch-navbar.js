const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PAGES = [
  'index.html',
  'about.html',
  'contact.html',
  'howitwork.html',
  'packages.html',
  'projects.html',
  'interior.html',
  'BuildingConstruction.html',
  'CommercialProjects.html',
  'commercial-works.html',
  'building-project-detail.html',
  'interior-project-detail.html',
  'commercial-work-detail.html',
];

const NAVBAR_BLOCK = `  <nav id="navbar">
    <a href="index.html" class="nav-logo"><img src="images/logo.png" alt="SayHomes logo"></a>

    <ul class="nav-links">
      <li><a href="index.html">Home</a></li>
      <li><a href="projects.html">Projects</a></li>
      <li><a href="packages.html">Packages</a></li>
      <li><a href="about.html">About</a></li>
      <li><a href="howitwork.html">How It Works</a></li>
      <li><a href="contact.html">Contact</a></li>
    </ul>

    <a href="#" class="nav-cta" data-open-enquiry>Start a Project</a>

    <button class="nav-toggle" id="navToggle" aria-label="Open menu" aria-expanded="false">
      <i class="fa-solid fa-bars"></i>
    </button>
  </nav>

  <div class="mobile-menu" id="mobileMenu">
    <a href="index.html"><i class="fa-solid fa-house"></i>Home</a>
    <a href="projects.html"><i class="fa-solid fa-images"></i>Projects</a>
    <a href="packages.html"><i class="fa-solid fa-layer-group"></i>Packages</a>
    <a href="about.html"><i class="fa-solid fa-building"></i>About</a>
    <a href="howitwork.html"><i class="fa-solid fa-route"></i>How It Works</a>
    <a href="#" data-open-enquiry><i class="fa-solid fa-phone"></i>Start a Project</a>
  </div>`;

function patch(fileName) {
  const filePath = path.join(ROOT, fileName);
  if (!fs.existsSync(filePath)) return;
  let html = fs.readFileSync(filePath, 'utf8');

  if (!html.includes('css/site-navbar.css')) {
    html = html.replace(
      /(<link rel="stylesheet" href="css\/enquiry-popup\.css">)/,
      '<link rel="stylesheet" href="css/site-navbar.css">\n  $1'
    );
    if (!html.includes('css/site-navbar.css')) {
      html = html.replace(
        /(<link rel="stylesheet" href="https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/font-awesome[^>]+>)/,
        '$1\n  <link rel="stylesheet" href="css/site-navbar.css">'
      );
    }
  }

  if (!html.includes('js/site-navbar.js')) {
    html = html.replace(
      /(<script src="js\/enquiry-popup\.js"><\/script>)/,
      '  <script src="js/site-navbar.js"></script>\n  $1'
    );
  }

  const navMatch = html.match(/<nav id="navbar">[\s\S]*?<\/div>\s*(?=\n\s*(?:<!--|(?:<a href="https:\/\/wa\.me)|<section|<header|<div class="page-hero"|$))/);
  if (navMatch) {
    let block = NAVBAR_BLOCK;
    if (fileName === 'index.html') {
      block = block.replace('<nav id="navbar">', '<nav id="navbar" class="navbar-hero">');
    }
    html = html.replace(navMatch[0], block + '\n\n');
  }

  html = html.replace(/<a href="contact\.html" class="nav-cta">Start a Project<\/a>/g, '<a href="#" class="nav-cta" data-open-enquiry>Start a Project</a>');
  html = html.replace(
    /<a href="contact\.html"><i class="fa-solid fa-phone"><\/i>Start a Project<\/a>/g,
    '<a href="#" data-open-enquiry><i class="fa-solid fa-phone"></i>Start a Project</a>'
  );

  html = html.replace(']Start a Project', 'Start a Project');

  fs.writeFileSync(filePath, html, 'utf8');
  console.log('Patched', fileName);
}

PAGES.forEach(patch);
