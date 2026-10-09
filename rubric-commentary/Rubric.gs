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

/** Choice list for the Form's "Rubric" dropdown - kept in sync via the menu. */
function rubricNamesFromTab_(ss) {
  var sheet = ss.getSheetByName(CONFIG.SHEET_RUBRICS);
  var fallback = ['(add a row to the Rubric tab first)'];
  if (!sheet || sheet.getLastRow() < 2) return fallback;
  var col = headerMap_(sheet);
  var names = sheet.getRange(2, col['RubricName'] + 1, sheet.getLastRow() - 1, 1)
    .getValues()
    .map(function (r) { return String(r[0]).trim(); })
    .filter(String);
  return names.length ? names : fallback;
}
