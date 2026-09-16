/**
 * Results tab is long-format: one row per (Student ID x Week x Trait).
 * That's what lets a single week write one row or three (the Week 12
 * finale) without any schema change, and what makes the teacher-report
 * pivot table a simple group-by.
 */

function writeResultRow_(row) {
  var sheet = getSheet_(CONFIG.SHEET_RESULTS);
  sheet.appendRow([
    new Date(),          // Timestamp
    row.cycle,            // Cycle - e.g. "Fall 2026", set once per cycle via the menu
    row.studentId,       // StudentID
    row.teacher,          // Teacher
    row.week,             // Week
    row.trait,            // Trait
    row.score,            // AI Score
    row.rationale,        // AI Rationale
    '',                   // TeacherHandScore (filled in by hand during norming)
    '',                   // Gap (add a =IF(I2="","",G2-I2) style formula down this column once)
    row.strength,          // Strength
    row.growthArea,        // GrowthArea
    row.studentMessage,    // StudentMessage
    'N'                    // Emailed
  ]);
}
