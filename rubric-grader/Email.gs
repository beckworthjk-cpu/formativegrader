/**
 * Sends student feedback emails - a deliberate menu action, not automatic
 * on every submission. Every Results row already has its grade the moment
 * it's written (Claude grades at submission time), so this is purely a
 * review point: nothing reaches a student's inbox until you run this.
 */

function sendPendingStudentEmails() {
  var sheet = getSheet_(CONFIG.SHEET_RESULTS);
  var data = sheet.getDataRange().getValues();
  var col = headerMap_(sheet);

  var sent = 0, skipped = 0;

  for (var i = 1; i < data.length; i++) {
    if (data[i][col['Emailed']] === 'Y') continue;

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
      'Score: ' + data[i][col['Score']] + '\n\n' +
      data[i][col['StudentMessage']] + '\n\n' +
      'What\'s working:\n' + data[i][col['Strengths']] + '\n\n' +
      'Areas to grow:\n' + data[i][col['AreasForGrowth']];

    GmailApp.sendEmail(student.email, subject, body);
    sheet.getRange(i + 1, col['Emailed'] + 1).setValue('Y');
    sent++;
  }

  SpreadsheetApp.getUi().alert(
    'Emails sent: ' + sent + (skipped ? '  |  Skipped (no email on file): ' + skipped : '')
  );
}
