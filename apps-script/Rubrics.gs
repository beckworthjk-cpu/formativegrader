/**
 * Rubric lookups. RubricSource can be pasted rubric text (any length, any
 * number of score levels) OR a Google Doc URL - same document a teacher
 * uses for hand-scoring can be linked here directly, no reformatting.
 */

function getRubricForTrait(trait) {
  var sheet = getSheet_(CONFIG.SHEET_RUBRICS);
  var data = sheet.getDataRange().getValues();
  var col = headerMap_(sheet);
  var target = String(trait).trim();

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][col['Trait']]).trim() === target) {
      var source = String(data[i][col['RubricSource']]).trim();
      var maxScoreRaw = data[i][col['MaxScore']];
      return {
        text: resolveTextSource_(source),
        maxScore: maxScoreRaw ? Number(maxScoreRaw) : null
      };
    }
  }
  throw new Error('No rubric found for trait "' + trait + '" in the "' + CONFIG.SHEET_RUBRICS + '" tab.');
}
