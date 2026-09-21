/**
 * Splits one dictated batch of notes into per-student chunks and turns each
 * chunk into rubric-checked written commentary via Claude - no score, ever.
 *
 * Expected dictation convention: say "Student <number>" (or "Students
 * <number>") right before you start talking about that paper, e.g.
 * "Student 14, good job with the topic sentence, but..." Everything between
 * one "Student <number>" and the next is treated as that student's notes.
 * Google Docs voice typing reliably transcribes spoken numbers as digits,
 * so say the number as digits ("fourteen" -> usually "14"), and proofread
 * the doc for misheard numbers before compiling - that's much faster to
 * fix in the doc than to untangle after the fact.
 */

function compilePendingNotes() {
  var ui = SpreadsheetApp.getUi();
  var sheet = getSheet_(CONFIG.SHEET_NOTES);
  var data = sheet.getDataRange().getValues();
  var col = headerMap_(sheet);

  var compiledCount = 0;
  var errorCount = 0;

  for (var r = 1; r < data.length; r++) {
    var row = data[r];
    if (row[col['Compiled']] === true) continue;
    if (!row[col['RubricName']] && !row[col['NotesText']]) continue; // blank row

    var rowNum = r + 1;
    var rubricName = String(row[col['RubricName']]).trim();
    var notesSource = row[col['NotesText']];

    try {
      var rubricText = getRubricByName_(rubricName);
      var notesText = resolveTextSource_(notesSource);
      var split = splitNotesByStudent_(notesText);

      if (split.preamble) {
        logError_(
          'Notes row ' + rowNum,
          'Text before the first "Student <number>" marker was ignored (no student to attach it to): "' +
            split.preamble.substring(0, 200) + '"'
        );
        errorCount++;
      }
      if (split.chunks.length === 0) {
        logError_('Notes row ' + rowNum, 'No "Student <number>" markers found - nothing compiled from this row.');
        errorCount++;
        continue;
      }

      for (var c = 0; c < split.chunks.length; c++) {
        var chunk = split.chunks[c];
        if (!chunk.notes) {
          logError_('Notes row ' + rowNum + ', Student ' + chunk.studentId, 'Empty notes for this student - skipped.');
          errorCount++;
          continue;
        }
        try {
          var result = callClaudeForCommentary(rubricText, chunk.notes);
          appendCommentaryRow_(rubricName, chunk.studentId, result);
          compiledCount++;
        } catch (chunkErr) {
          logError_('Notes row ' + rowNum + ', Student ' + chunk.studentId, chunkErr.message || chunkErr);
          errorCount++;
        }
      }

      sheet.getRange(rowNum, col['Compiled'] + 1).setValue(true);
    } catch (rowErr) {
      logError_('Notes row ' + rowNum, rowErr.message || rowErr);
      errorCount++;
    }
  }

  ui.alert(
    'Compile finished.\n\n' +
    'Commentary written for ' + compiledCount + ' student(s).\n' +
    (errorCount ? errorCount + ' issue(s) logged to the Errors tab.' : 'No issues.')
  );
}

/**
 * Splits raw dictated text on "Student <number>" markers. Returns:
 *   chunks: [{ studentId, notes }, ...] in the order they were dictated
 *   preamble: any text before the first marker (should normally be empty -
 *             it means something was said before naming a student)
 */
function splitNotesByStudent_(text) {
  var re = /\bstudents?\s*#?\s*(\d+)\b[:,.\-]?\s*/gi;
  var markers = [];
  var m;
  while ((m = re.exec(text)) !== null) {
    markers.push({ studentId: m[1], contentStart: re.lastIndex, markerStart: m.index });
  }

  var chunks = [];
  for (var i = 0; i < markers.length; i++) {
    var end = (i + 1 < markers.length) ? markers[i + 1].markerStart : text.length;
    chunks.push({
      studentId: markers[i].studentId,
      notes: text.substring(markers[i].contentStart, end).trim()
    });
  }

  var preamble = markers.length ? text.substring(0, markers[0].markerStart).trim() : text.trim();
  return { chunks: chunks, preamble: preamble };
}

function appendCommentaryRow_(rubricName, studentId, result) {
  var sheet = getSheet_(CONFIG.SHEET_COMMENTARY);
  sheet.appendRow([
    new Date(),
    rubricName,
    studentId,
    getStudentName_(studentId),
    result.strengths,
    result.areas_for_growth
  ]);
}
