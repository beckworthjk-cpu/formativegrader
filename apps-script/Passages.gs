/**
 * Source-text lookups for formatives that ask students to analyze a
 * specific passage (tone, rhetorical devices, etc.) rather than just
 * write their own argument. Keyed by Cycle + Week, not by Trait - the
 * same passage applies across all 4 teachers and every trait scored
 * that week (confirmed: one shared passage per week, not per teacher).
 *
 * Not every week needs one - CER traits like Claim Clarity are scored
 * purely from the student's own writing. getPassageText returns '' when
 * there's no row for that Cycle/Week, and the grading call simply omits
 * the passage section rather than treating a missing one as an error.
 */

function getPassageText(cycle, week) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEET_PASSAGES);
  if (!sheet || sheet.getLastRow() < 2) return '';

  var data = sheet.getDataRange().getValues();
  var col = headerMap_(sheet);
  var cycleTarget = String(cycle || '').trim();
  var weekTarget = String(week || '').trim();

  for (var i = 1; i < data.length; i++) {
    var rowCycle = String(data[i][col['Cycle']] || '').trim();
    var rowWeek = String(data[i][col['Week']] || '').trim();
    if (rowCycle === cycleTarget && rowWeek === weekTarget) {
      var source = String(data[i][col['SourceText']] || '').trim();
      return source ? resolveTextSource_(source) : '';
    }
  }
  return '';
}
