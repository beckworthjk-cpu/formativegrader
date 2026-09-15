/**
 * Roster lookups. This tab is the only place Student ID and Name/Email
 * co-occur - keep it access-restricted (see protectRosterSheet_ in Setup.gs).
 */

function lookupStudent(studentId) {
  var sheet = getSheet_(CONFIG.SHEET_ROSTER);
  var data = sheet.getDataRange().getValues();
  var col = headerMap_(sheet);
  var target = String(studentId).trim();

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][col['StudentID']]).trim() === target) {
      return {
        studentId: data[i][col['StudentID']],
        name: data[i][col['Name']],
        email: data[i][col['Email']],
        teacher: data[i][col['Teacher']]
      };
    }
  }
  return null;
}
