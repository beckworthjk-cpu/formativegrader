/**
 * Roster is optional - it exists only so the Commentary tab can show a name
 * next to each Student ID, and so emails have somewhere to send to. A
 * Student ID with no Roster row still compiles fine; Name/Email are just
 * left blank (and that student is skipped, not guessed at, when sending
 * emails - see Email.gs).
 */
function lookupStudent_(studentId) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEET_ROSTER);
  if (!sheet || sheet.getLastRow() < 2) return null;
  var data = sheet.getDataRange().getValues();
  var col = headerMap_(sheet);
  var target = String(studentId).trim();

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][col['StudentID']]).trim() === target) {
      return {
        studentId: data[i][col['StudentID']],
        name: String(data[i][col['Name']] || '').trim(),
        email: String(data[i][col['Email']] || '').trim()
      };
    }
  }
  return null;
}

function getStudentName_(studentId) {
  var student = lookupStudent_(studentId);
  return student ? student.name : '';
}
