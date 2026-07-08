/**
 * SayHomes — Projects API (read + form submit)
 *
 * Sheet tab: "Projects"
 *
 * Row 1 headers:
 * Type | Owner | Title | Location | Description | Sector | Project Key | Cover Image | Gallery Images | Video URL | Sort Order | Show
 *
 * Type: building | interior | commercial
 * Gallery Images: one image URL per line (Alt+Enter in cell)
 * Sector (commercial only): institutions | hospitality | nonprofit | commercial | peb
 * Project Key (commercial): e.g. leaders, ima, gsk
 *
 * Deploy → Web app → Anyone
 * Paste URL in js/projects-loader.js and admin-project-form.html
 */

var PROJECTS_SHEET_NAME = 'Projects';
var ADMIN_SECRET = 'sayhomes-projects-2026'; // change this after deploy

function doGet() {
  var sheet = getProjectsSheet_();
  if (!sheet) {
    return jsonOut_({ ok: true, building: [], interior: [], commercial: [] });
  }

  var data = sheet.getDataRange().getValues();
  if (!data.length) {
    return jsonOut_({ ok: true, building: [], interior: [], commercial: [] });
  }

  var headers = data[0].map(function (h) {
    return String(h || '').trim();
  });
  var rows = data.slice(1);
  var parsed = { building: [], interior: [], commercial: [] };

  rows.forEach(function (row) {
    var obj = rowToObject_(headers, row);
    if (!isShown_(obj.Show)) return;

    var type = String(obj.Type || '').trim().toLowerCase();
    var owner = String(obj.Owner || '').trim();
    var title = String(obj.Title || '').trim();
    var location = String(obj.Location || '').trim();
    if (!owner && !title) return;

    var gallery = parseGallery_(obj['Gallery Images']);
    var cover = String(obj['Cover Image'] || '').trim();
    if (!gallery.length && cover) gallery = [cover];

    var item = {
      owner: owner,
      title: title || location,
      location: location || title,
      description: String(obj.Description || '').trim(),
      gallery: gallery,
      cover: cover || gallery[0] || '',
      sortOrder: Number(obj['Sort Order']) || 0,
    };

    if (type === 'building') {
      parsed.building.push(item);
      return;
    }

    if (type === 'interior') {
      parsed.interior.push(item);
      return;
    }

    if (type === 'commercial') {
      var key = String(obj['Project Key'] || '').trim() || slugify_(owner || title);
      parsed.commercial.push({
        key: key,
        name: owner || title,
        sector: String(obj.Sector || 'commercial').trim().toLowerCase(),
        video: String(obj['Video URL'] || '').trim(),
        images: gallery,
        cover: cover || gallery[0] || '',
        sortOrder: Number(obj['Sort Order']) || 0,
      });
    }
  });

  sortProjects_(parsed.building);
  sortProjects_(parsed.interior);
  sortProjects_(parsed.commercial);

  return jsonOut_({
    ok: true,
    building: parsed.building,
    interior: parsed.interior,
    commercial: parsed.commercial,
  });
}

function doPost(e) {
  try {
    var p = (e && e.parameter) ? e.parameter : {};
    if (String(p.secret || '') !== ADMIN_SECRET) {
      return jsonOut_({ ok: false, error: 'Unauthorized' });
    }

    var sheet = getProjectsSheet_();
    if (!sheet) {
      return jsonOut_({ ok: false, error: 'Projects sheet not found' });
    }

    sheet.appendRow([
      String(p.type || '').trim(),
      String(p.owner || '').trim(),
      String(p.title || '').trim(),
      String(p.location || '').trim(),
      String(p.description || '').trim(),
      String(p.sector || '').trim(),
      String(p.projectKey || '').trim(),
      String(p.coverImage || '').trim(),
      String(p.galleryImages || '').trim(),
      String(p.videoUrl || '').trim(),
      Number(p.sortOrder) || '',
      String(p.show || 'YES').trim(),
    ]);

    return jsonOut_({ ok: true, result: 'success' });
  } catch (err) {
    return jsonOut_({ ok: false, error: String(err) });
  }
}

function getProjectsSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(PROJECTS_SHEET_NAME);
  if (!sheet) sheet = ss.getSheets()[0];
  return sheet;
}

function rowToObject_(headers, row) {
  var obj = {};
  headers.forEach(function (header, i) {
    if (header) obj[header] = row[i];
  });
  return obj;
}

function parseGallery_(text) {
  return String(text || '')
    .split(/\r?\n|,/)
    .map(function (s) {
      return String(s || '').trim();
    })
    .filter(Boolean);
}

function isShown_(val) {
  var show = String(val || 'YES').trim().toUpperCase();
  return show !== 'NO' && show !== 'N' && show !== 'FALSE' && show !== '0';
}

function sortProjects_(list) {
  list.sort(function (a, b) {
    var so = (a.sortOrder || 0) - (b.sortOrder || 0);
    if (so !== 0) return so;
    return String(a.owner || '').localeCompare(String(b.owner || ''));
  });
}

function slugify_(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function jsonOut_(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(
    ContentService.MimeType.JSON
  );
}
