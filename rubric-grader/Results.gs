/**
 * Results tab is one row per Form submission - one student, one rubric,
 * graded the moment it's submitted. Emailed is left blank by the script;
 * Send Pending Student Emails sets it once that row's email has gone out.
 */
function writeResultRow_(rubricName, studentId, result) {
  var sheet = getSheet_(CONFIG.SHEET_RESULTS);
  sheet.appendRow([
    new Date(),
    rubricName,
    studentId,
    getStudentName_(studentId),
    result.score,
    result.rationale_for_teacher,
    result.strength,
    result.growth_area,
    result.student_message,
    '' // Emailed
  ]);
}
