/**
 * SayHomes — Lead form → Google Sheet
 *
 * Sheet: https://docs.google.com/spreadsheets/d/1ahF-xf9L1rRuGEb3QjFMvsubiCjD6a7mVCyjW67Bdow/edit
 *
 * Setup:
 * 1. Open the sheet → Extensions → Apps Script
 * 2. Paste this file (replace default Code.gs)
 * 3. Row 1 headers (exact order):
 *    Timestamp | Source | Name | Phone | Email | Location | Service | Message
 * 4. Deploy → New deployment → Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 5. Copy the Web App URL into js/lead-form.js (GOOGLE_SCRIPT_URL)
 */

var SHEET_ID = '1ahF-xf9L1rRuGEb3QjFMvsubiCjD6a7mVCyjW67Bdow';

function doPost(e) {
  try {
    var p = (e && e.parameter) ? e.parameter : {};
    var sheet = SpreadsheetApp.openById(SHEET_ID).getSheets()[0];

    sheet.appendRow([
      new Date(),
      p.source || '',
      p.name || '',
      p.phone || '',
      p.email || '',
      p.location || '',
      p.service || '',
      p.message || ''
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ result: 'success' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ result: 'error', message: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({ result: 'ok', sheet: SHEET_ID }))
    .setMimeType(ContentService.MimeType.JSON);
}
