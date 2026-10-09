/**
 * Shared helpers for reading/writing tabs and logging errors without ever
 * letting one bad chunk stop the rest of a compile run.
 */

function getSheet_(name) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
  if (!sheet) {
    throw new Error('Missing expected tab: "' + name + '". Run "Rubric Commentary > Setup Sheets" first.');
  }
  return sheet;
}

function ensureSheet_(ss, name, headers) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

/** Returns { headerName: columnIndex (0-based) } for a sheet's header row. */
function headerMap_(sheet) {
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var map = {};
  headers.forEach(function (h, i) { map[h] = i; });
  return map;
}

function logError_(context, message) {
  try {
    var sheet = getSheet_(CONFIG.SHEET_ERRORS);
    sheet.appendRow([new Date(), context, String(message)]);
  } catch (e) {
    // Errors tab itself missing (setup not run) - fall back to the execution log
    // so nothing is silently lost.
    console.error(context + ': ' + message);
  }
}

/**
 * Shared by Rubric and Notes: a cell can hold pasted text directly, or a
 * Google Doc URL to pull the full text from - so you can keep dictating
 * into Google Docs the way you already do and just link the doc here
 * instead of copy-pasting it in.
 */
function resolveTextSource_(source) {
  source = String(source).trim();
  if (source.indexOf('docs.google.com') !== -1) {
    return DocumentApp.openById(extractDocId_(source)).getBody().getText();
  }
  return source;
}

function extractDocId_(url) {
  var match = url.match(/[-\w]{25,}/);
  if (!match) throw new Error('Could not find a Google Doc ID in URL: ' + url);
  return match[0];
}
