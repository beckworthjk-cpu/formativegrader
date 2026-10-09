/**
 * Sends student feedback emails - a deliberate menu action, not automatic.
 * Only sends a row once BOTH the commentary exists (from "Compile Pending
 * Notes") AND you've filled in Score by hand from your printed rubric - a
 * row with no Score yet is treated as "not ready", not an error, so it's
 * silently left for next time rather than emailing feedback with no grade
 * attached.
 */

function sendPendingStudentEmails() {
  var sheet = getSheet_(CONFIG.SHEET_COMMENTARY);
  var data = sheet.getDataRange().getValues();
  var col = headerMap_(sheet);

  var sent = 0, skipped = 0, notReady = 0;

  for (var i = 1; i < data.length; i++) {
    if (data[i][col['Emailed']] === 'Y') continue;

    var score = String(data[i][col['Score']] || '').trim();
    if (!score) { notReady++; continue; }

    var studentId = data[i][col['StudentID']];
    var student = lookupStudent_(studentId);
    if (!student || !student.email) {
      logError_('sendPendingStudentEmails', 'No roster email on file for Student ID ' + studentId + ' - skipped.');
      skipped++;
      continue;
    }

    var rubricName = data[i][col['RubricName']];
    var subject = rubricName + ' Feedback';
    var body = 'Hi ' + (student.name || 'there') + ',\n\n' +
      'Score: ' + score + '\n\n' +
      'What\'s working:\n' + data[i][col['Strengths']] + '\n\n' +
      'Areas to grow:\n' + data[i][col['AreasForGrowth']];

    GmailApp.sendEmail(student.email, subject, body);
    sheet.getRange(i + 1, col['Emailed'] + 1).setValue('Y');
    sent++;
  }

  SpreadsheetApp.getUi().alert(
    'Emails sent: ' + sent +
    (notReady ? '  |  Waiting on a Score: ' + notReady : '') +
    (skipped ? '  |  Skipped (no email on file): ' + skipped : '')
  );
}
