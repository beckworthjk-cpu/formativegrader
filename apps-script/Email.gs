/**
 * Sends student feedback emails - a deliberate menu action, not automatic
 * on every submission, so a teacher can look at the Results tab first.
 * All un-emailed rows for the same Cycle + Student ID + Week are combined
 * into one email rather than one email per trait.
 */

function sendPendingStudentEmails() {
  var sheet = getSheet_(CONFIG.SHEET_RESULTS);
  var data = sheet.getDataRange().getValues();
  var col = headerMap_(sheet);

  var groups = {}; // "cycle::studentId::week" -> [row indexes into `data`]
  for (var i = 1; i < data.length; i++) {
    if (data[i][col['Emailed']] === 'Y') continue;
    // Hand-graded rows have no AI-written StudentMessage - nothing to send,
    // and they're left un-flagged as Emailed (not 'Y', since nothing was
    // actually sent) rather than sending a blank line for that trait.
    if (!String(data[i][col['StudentMessage']] || '').trim()) continue;
    var key = data[i][col['Cycle']] + '::' + data[i][col['StudentID']] + '::' + data[i][col['Week']];
    (groups[key] = groups[key] || []).push(i);
  }

  var sent = 0, skipped = 0;
  Object.keys(groups).forEach(function (key) {
    var rows = groups[key];
    var cycle = data[rows[0]][col['Cycle']];
    var studentId = data[rows[0]][col['StudentID']];
    var week = data[rows[0]][col['Week']];
    var student = lookupStudent(studentId);

    if (!student || !student.email) {
      logError_('sendPendingStudentEmails', 'No roster email on file for Student ID ' + studentId + ' - skipped.');
      skipped++;
      return;
    }

    var feedback = rows.map(function (i) {
      return '- ' + data[i][col['Trait']] + ': ' + data[i][col['StudentMessage']];
    }).join('\n\n');

    var subject = (cycle ? cycle + ' - ' : '') + 'Your Week ' + week + ' Writing Feedback';
    var body = 'Hi ' + (student.name || 'there') + ',\n\n' +
      'Here is your feedback for Week ' + week + ':\n\n' +
      feedback +
      '\n\nKeep up the good work!';

    GmailApp.sendEmail(student.email, subject, body);

    rows.forEach(function (i) {
      sheet.getRange(i + 1, col['Emailed'] + 1).setValue('Y');
    });
    sent++;
  });

  SpreadsheetApp.getUi().alert('Emails sent: ' + sent + (skipped ? ('  |  Skipped (no email on file): ' + skipped) : ''));
}
