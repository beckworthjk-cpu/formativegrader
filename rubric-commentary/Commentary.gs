/**
 * Commentary tab is one row per Form submission - one student, one rubric,
 * compiled the moment they're submitted. Score and Emailed are left blank
 * by the script; Score is filled in by hand once you've circled it on the
 * printed rubric, and Emailed is set by Send Pending Student Emails.
 */
function appendCommentaryRow_(rubricName, studentId, result) {
  var sheet = getSheet_(CONFIG.SHEET_COMMENTARY);
  sheet.appendRow([
    new Date(),
    rubricName,
    studentId,
    getStudentName_(studentId),
    result.strengths,
    result.areas_for_growth,
    '', // Score
    ''  // Emailed
  ]);
}
