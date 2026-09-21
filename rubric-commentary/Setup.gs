/**
 * One-time setup: run "Setup Sheets" from the menu, then fill in Rubric
 * (and optionally Roster) by hand.
 */
function setupSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  ensureSheet_(ss, CONFIG.SHEET_ROSTER, ROSTER_HEADERS);
  ensureSheet_(ss, CONFIG.SHEET_RUBRICS, RUBRIC_HEADERS);
  ensureSheet_(ss, CONFIG.SHEET_NOTES, NOTES_HEADERS);
  ensureSheet_(ss, CONFIG.SHEET_COMMENTARY, COMMENTARY_HEADERS);
  ensureSheet_(ss, CONFIG.SHEET_ERRORS, ERROR_HEADERS);
  SpreadsheetApp.getUi().alert(
    'Tabs are set up.\n\n' +
    'Next: add a row to Rubric for each assignment (RubricName + pasted text ' +
    'or a Google Doc URL). Roster is optional - fill it in if you want names ' +
    'next to Student IDs in the Commentary tab.\n\n' +
    'Then: dictate notes into a Google Doc (one doc per batch of papers), ' +
    'add a row to Notes with that batch\'s RubricName and the doc\'s URL (or ' +
    'pasted text), and run "Compile Pending Notes".'
  );
}
