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
        teacher: data[i][col['Teacher']],
        // col['GradingMode'] is undefined on a Roster tab that predates this
        // column - data[i][undefined] is just undefined, not an error, so
        // this still works and falls back to '' (treated as AI mode).
        gradingMode: data[i][col['GradingMode']] || ''
      };
    }
  }
  return null;
}

/**
 * Cross-checks the school email Google verified on this submission (only
 * available when the Form's "Collect email addresses" is set to Verified)
 * against what's on file. Fills Roster's Email cell if it's blank - saves
 * typing every student's email in by hand - or logs a mismatch instead of
 * silently trusting either value, since a mismatch usually means a typo'd
 * Student ID. This never reaches Claude; it only ever touches this Sheet.
 */
function syncVerifiedEmail_(studentId, verifiedEmail) {
  if (!verifiedEmail) return; // Form isn't collecting verified emails

  var sheet = getSheet_(CONFIG.SHEET_ROSTER);
  var data = sheet.getDataRange().getValues();
  var col = headerMap_(sheet);
  var target = String(studentId).trim();

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][col['StudentID']]).trim() !== target) continue;

    var onFile = String(data[i][col['Email']] || '').trim();
    if (!onFile) {
      sheet.getRange(i + 1, col['Email'] + 1).setValue(verifiedEmail);
      logError_('email auto-filled', 'Student ID ' + studentId + ' had no email on file - filled in from the verified Form submission (' + verifiedEmail + ').');
    } else if (onFile.toLowerCase() !== verifiedEmail.toLowerCase()) {
      logError_('email mismatch', 'Student ID ' + studentId + ' submitted from ' + verifiedEmail + ', but Roster has ' + onFile + ' on file - verify this is the right student.');
    }
    return;
  }
}
