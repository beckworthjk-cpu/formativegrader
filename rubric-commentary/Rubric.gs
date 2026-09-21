/**
 * Rubric lookup by name. RubricSource can be pasted rubric text or a Google
 * Doc URL - same rubric a teacher already uses for hand-scoring works here
 * unmodified.
 */
function getRubricByName_(rubricName) {
  var sheet = getSheet_(CONFIG.SHEET_RUBRICS);
  var data = sheet.getDataRange().getValues();
  var col = headerMap_(sheet);
  var target = String(rubricName).trim();

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][col['RubricName']]).trim() === target) {
      var source = data[i][col['RubricSource']];
      if (!source) throw new Error('Rubric "' + target + '" has no RubricSource.');
      return resolveTextSource_(source);
    }
  }
  throw new Error('No rubric found named "' + target + '" in the "' + CONFIG.SHEET_RUBRICS + '" tab.');
}
