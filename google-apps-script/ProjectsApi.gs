/**
 * SayHomes — Projects API (read + form submit + Drive image proxy)
 *
 * Sheet tab: "Projects"
 * Headers:
 * Type | Owner | Title | Location | Description | Sector | Project Key | Cover Image | Gallery Images | Video URL | Sort Order | Show
 *
 * For building/interior: leave Sector + Project Key EMPTY.
 * Paste full Drive links only in Cover Image and Gallery Images.
 *
 * Deploy → Web app → Anyone → New version after each code change
 */

var PROJECTS_SHEET_NAME = 'Projects';
var ADMIN_SECRET = 'sayhomes-projects-2026';

function doGet(e) {
  e = e || {};
  var p = (e.parameter) ? e.parameter : {};

  // Image proxy: /exec?action=drive&id=FILE_ID
  if (String(p.action || '') === 'drive' && p.id) {
    return serveDriveImage_(String(p.id));
  }

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

    var images = collectProjectImages_(obj);
    var gallery = images.gallery.map(normalizeImageUrl_);
    var cover = normalizeImageUrl_(images.cover);
    if (!gallery.length && cover) gallery = [cover];
    if (!gallery.length) return;

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
      var key = String(obj['Project Key'] || '').trim();
      if (/drive\.google\.com/i.test(key)) key = '';
      key = key || slugify_(owner || title);
      parsed.commercial.push({
        key: key,
        name: owner || title,
        sector: normalizeSector_(obj.Sector),
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

/** Serve Drive file as base64 JSON so website <img> can display it */
function serveDriveImage_(fileId) {
  try {
    var file = DriveApp.getFileById(fileId);
    try {
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (shareErr) {}

    var blob = file.getBlob();
    var bytes = blob.getBytes();
    // Keep responses smaller for web cards
    if (bytes.length > 4.5 * 1024 * 1024) {
      return jsonOut_({
        ok: true,
        contentType: 'image/jpeg',
        url: 'https://drive.google.com/thumbnail?id=' + fileId + '&sz=w2000',
      });
    }

    return jsonOut_({
      ok: true,
      contentType: blob.getContentType() || 'image/jpeg',
      data: Utilities.base64Encode(bytes),
    });
  } catch (err) {
    return jsonOut_({
      ok: false,
      error: String(err),
      url: 'https://drive.google.com/thumbnail?id=' + fileId + '&sz=w2000',
    });
  }
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

    var galleryRaw = String(p.galleryImages || '').trim();
    var galleryNorm = parseGallery_(galleryRaw).map(normalizeImageUrl_).join('\n');
    var coverNorm = normalizeImageUrl_(String(p.coverImage || '').trim());

    sheet.appendRow([
      String(p.type || '').trim(),
      String(p.owner || '').trim(),
      String(p.title || '').trim(),
      String(p.location || '').trim(),
      String(p.description || '').trim(),
      String(p.sector || '').trim(),
      String(p.projectKey || '').trim(),
      coverNorm,
      galleryNorm || galleryRaw,
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

/** Pull image URLs even if customer pasted Drive link in wrong columns */
function collectProjectImages_(obj) {
  var cover = String(obj['Cover Image'] || '').trim();
  var gallery = parseGallery_(obj['Gallery Images']);

  var extras = []
    .concat(parseGallery_(obj['Sector']))
    .concat(parseGallery_(obj['Project Key']))
    .concat(parseGallery_(obj['Video URL']))
    .concat(parseGallery_(cover));

  extras.forEach(function (u) {
    if (isUsableImage_(u) && gallery.indexOf(u) === -1) gallery.push(u);
  });

  // If Cover Image is broken/short, use first good gallery/drive URL
  if (!isUsableImage_(cover)) {
    cover = '';
    for (var i = 0; i < gallery.length; i++) {
      if (isUsableImage_(gallery[i])) {
        cover = gallery[i];
        break;
      }
    }
  }

  gallery = gallery.filter(isUsableImage_);
  return { cover: cover, gallery: gallery };
}

function isUsableImage_(u) {
  var s = String(u || '').trim();
  if (!s || s.length < 8) return false;
  if (/youtube\.com|youtu\.be/i.test(s)) return false;
  if (/^https?:\/\/drive\.google$/i.test(s)) return false; // truncated cell
  if (/drive\.google\.com/i.test(s)) return /\/d\/|id=/.test(s);
  if (/\.(jpe?g|png|webp|gif|avif|bmp)(\?|$)/i.test(s)) return true;
  if (/^https?:\/\//i.test(s)) return true;
  if (/^(interior|commercial|residentail|images)\//i.test(s)) return true;
  if (/^\.\//.test(s)) return true;
  return false;
}

function normalizeSector_(val) {
  var s = String(val || 'commercial').trim().toLowerCase();
  if (/drive\.google\.com|^https?:\/\//i.test(s)) return 'commercial';
  return s || 'commercial';
}

function parseGallery_(text) {
  var lines = String(text || '').split(/\r?\n/);
  var out = [];
  lines.forEach(function (line) {
    var t = String(line || '').trim();
    if (!t) return;
    if (/^https?:\/\//i.test(t) || /drive\.google\.com/i.test(t)) {
      out.push(t);
      return;
    }
    String(t)
      .split(',')
      .map(function (s) {
        return String(s || '').trim();
      })
      .filter(Boolean)
      .forEach(function (s) {
        out.push(s);
      });
  });
  return out;
}

function extractDriveId_(url) {
  var s = String(url || '').trim();
  var idMatch =
    s.match(/\/file\/d\/([^/?&#]+)/) ||
    s.match(/[?&]id=([^&]+)/) ||
    s.match(/\/thumbnail\?id=([^&]+)/) ||
    s.match(/\/d\/([^/?&#]+)/);
  return idMatch && idMatch[1] ? idMatch[1] : '';
}

/** Convert Google Drive share links for website use (fast — no DriveApp calls here) */
function normalizeImageUrl_(url) {
  var s = String(url || '').trim();
  if (!s) return '';

  var id = extractDriveId_(s);
  if (id && /drive\.google\.com|docs\.google\.com/i.test(s)) {
    return 'https://drive.google.com/thumbnail?id=' + id + '&sz=w1000';
  }

  return s;
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
