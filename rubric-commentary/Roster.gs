/**
 * Roster is optional - it exists only so the Commentary tab can show a name
 * next to each Student ID while you're matching rows back to papers. A
 * Student ID with no Roster row still compiles fine; Name is just left
 * blank.
 */
function getStudentName_(studentId) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEET_ROSTER);
  if (!sheet || sheet.getLastRow() < 2) return '';
  var data = sheet.getDataRange().getValues();
  var col = headerMap_(sheet);
  var target = String(studentId).trim();

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][col['StudentID']]).trim() === target) {
      return String(data[i][col['Name']] || '').trim();
    }
  }
  return '';
}
