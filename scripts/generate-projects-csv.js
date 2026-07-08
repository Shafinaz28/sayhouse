/**
 * Generates google-sheet-import/Projects.csv from all website project data.
 * Run: node scripts/generate-projects-csv.js
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'google-sheet-import', 'Projects.csv');

const HEADERS = [
  'Type',
  'Owner',
  'Title',
  'Location',
  'Description',
  'Sector',
  'Project Key',
  'Cover Image',
  'Gallery Images',
  'Video URL',
  'Sort Order',
  'Show',
];

function decodeUrl(pathStr) {
  try {
    return decodeURIComponent(String(pathStr || '').trim());
  } catch {
    return String(pathStr || '').trim();
  }
}

function galleryCell(images) {
  return (images || [])
    .map(decodeUrl)
    .filter(Boolean)
    .join('\n');
}

function csvEscape(value) {
  const text = String(value ?? '');
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function rowToCsv(row) {
  return HEADERS.map((h) => csvEscape(row[h] ?? '')).join(',');
}

function loadJsArray(filePath, globalName) {
  const code = fs.readFileSync(filePath, 'utf8');
  const sandbox = { window: {} };
  vm.runInContext(code, vm.createContext(sandbox));
  return sandbox.window[globalName] || [];
}

function loadCommercial() {
  const code = fs.readFileSync(path.join(ROOT, 'js', 'commercial-sectors.js'), 'utf8');
  const sandbox = { window: {} };
  vm.runInContext(code, vm.createContext(sandbox));
  const commercial = sandbox.window.SayHomesCommercial;
  if (!commercial) return [];

  const keyToSector = {};
  Object.entries(commercial.SECTORS).forEach(([sectorId, sector]) => {
    (sector.projectKeys || []).forEach((key) => {
      keyToSector[key] = sectorId;
    });
  });

  return Object.entries(commercial.PROJECTS).map(([key, project], index) => ({
    Type: 'commercial',
    Owner: project.name || key,
    Title: '',
    Location: inferLocation(project.name),
    Description: `Commercial project — ${project.name || key}.`,
    Sector: keyToSector[key] || 'commercial',
    'Project Key': key,
    'Cover Image': decodeUrl((project.images || [])[0] || ''),
    'Gallery Images': galleryCell(project.images),
    'Video URL': project.video || '',
    'Sort Order': index + 1,
    Show: 'YES',
  }));
}

function inferLocation(text) {
  const t = String(text || '');
  if (/bengaluru|bangalore/i.test(t)) return 'Bengaluru';
  if (/davangere|davanagere/i.test(t)) return 'Davanagere';
  if (/gauribidanur/i.test(t)) return 'Gauribidanur';
  if (/chikkaballapura/i.test(t)) return 'Chikkaballapura';
  if (/mangaluru|puttur/i.test(t)) return 'Mangaluru';
  if (/rajanukunte/i.test(t)) return 'Rajanukunte';
  return 'Bengaluru';
}

function buildingDescription(title, owner) {
  return `Residential construction at ${title || 'Bengaluru'} — quality structure, elevation, and finishes for ${owner || 'client'}.`;
}

function interiorDescription(title, owner) {
  return `Interior project for ${owner || 'client'} at ${title || 'Bengaluru'} — refined finishes and practical layouts.`;
}

function residentialRows(type, list, descFn) {
  return list
    .filter((p) => Array.isArray(p.gallery) && p.gallery.filter(Boolean).length)
    .map((p, index) => {
      const gallery = p.gallery.filter(Boolean).map(decodeUrl);
      const title = p.title || '';
      const location = p.location || inferLocation(title) || 'Bengaluru';
      return {
        Type: type,
        Owner: p.owner || '',
        Title: title,
        Location: location,
        Description: p.description || descFn(title, p.owner),
        Sector: '',
        'Project Key': '',
        'Cover Image': gallery[0] || '',
        'Gallery Images': galleryCell(gallery),
        'Video URL': '',
        'Sort Order': index + 1,
        Show: 'YES',
      };
    });
}

function loadBuildingFromGit() {
  try {
    const html = execSync('git show f7b45f1:BuildingConstruction.html', {
      cwd: ROOT,
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024,
    });
    const start = html.indexOf('const projects = [');
    const end = html.indexOf(']\n      .sort', start);
    if (start < 0 || end < 0) return null;
    const arrayCode = html.slice(start + 'const '.length, end + 1);
    return Function(`return ${arrayCode}`)();
  } catch {
    return null;
  }
}

function main() {
  const buildingGit = loadBuildingFromGit();
  const buildingFile = loadJsArray(path.join(ROOT, 'js', 'building-projects-data.js'), 'BUILDING_PROJECTS');
  const building = buildingGit && buildingGit.length >= buildingFile.length ? buildingGit : buildingFile;

  const interior = loadJsArray(path.join(ROOT, 'js', 'interior-projects-data.js'), 'INTERIOR_PROJECTS');
  const commercial = loadCommercial();

  const rows = [
    ...residentialRows('building', building, buildingDescription),
    ...residentialRows('interior', interior, interiorDescription),
    ...commercial,
  ];

  const csv = [HEADERS.join(','), ...rows.map(rowToCsv)].join('\n') + '\n';
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, csv, 'utf8');

  console.log(`Wrote ${rows.length} projects to ${OUT}`);
  console.log(`  Building: ${building.length}`);
  console.log(`  Interior: ${interior.filter((p) => p.gallery?.length).length}`);
  console.log(`  Commercial: ${commercial.length}`);
}

main();
