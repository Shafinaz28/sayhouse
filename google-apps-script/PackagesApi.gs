/**
 * SayHomes — Packages API
 * Tab: "Packages" (or first tab)
 *
 * Row 1:
 * Package Name | Old Price | New Price | Sort Order | Show | Section Title | Section Sort | Details
 *
 * Returns JSON grouped by package with sections (heading + details for dropdown).
 */

function doGet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Packages') || ss.getSheets()[0];
  const data = sheet.getDataRange().getValues();

  if (!data.length) {
    return jsonOut({ packages: [] });
  }

  const headers = data[0].map(function (h) {
    return String(h || '').trim();
  });
  const rows = data.slice(1);

  const map = {};
  const order = [];

  rows.forEach(function (row) {
    var obj = {};
    headers.forEach(function (header, i) {
      if (header) obj[header] = row[i];
    });

    var name = String(obj['Package Name'] || '').trim();
    if (!name) return;

    var show = String(obj['Show'] || 'YES').trim().toUpperCase();
    if (show === 'NO' || show === 'N' || show === 'FALSE' || show === '0') return;

    if (!map[name]) {
      map[name] = {
        name: name,
        oldPrice: normalizePrice(obj['Old Price']),
        newPrice: normalizePrice(obj['New Price']),
        sortOrder: Number(obj['Sort Order']) || order.length + 1,
        sections: [],
      };
      order.push(name);
    }

    var title = String(obj['Section Title'] || '').trim();
    if (title) {
      map[name].sections.push({
        title: title,
        sortOrder: Number(obj['Section Sort']) || map[name].sections.length + 1,
        details: String(obj['Details'] || '').trim(),
      });
    }
  });

  var packages = order.map(function (name) {
    var pkg = map[name];
    pkg.sections.sort(function (a, b) {
      return (a.sortOrder || 0) - (b.sortOrder || 0);
    });
    return pkg;
  });

  packages.sort(function (a, b) {
    return (a.sortOrder || 0) - (b.sortOrder || 0);
  });

  return jsonOut({ packages: packages });
}

function normalizePrice(val) {
  if (val === '' || val === null || val === undefined) return '';
  return String(val).replace(/[^\d.]/g, '').trim();
}

function jsonOut(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(
    ContentService.MimeType.JSON
  );
}
