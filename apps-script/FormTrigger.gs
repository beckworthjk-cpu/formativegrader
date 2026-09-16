/**
 * Fires automatically when a student submits the Google Form. One
 * submission can carry multiple traits (checkbox item) - the Week 12
 * finale selects all three CER traits at once, so this scores each
 * selected trait as its own Claude call and its own Results row.
 *
 * A failure on one trait (bad rubric row, transient API error) is logged
 * to the Errors tab and does not stop the other traits in this submission,
 * or any other student's submission, from being scored.
 */

function onFormSubmit(e) {
  try {
    var answers = itemResponsesByTitle_(e);

    var studentId = String(answers['Student ID'] || '').trim();
    var week = answers['Week'];
    var responseText = answers['Response'];
    var traits = normalizeTraits_(answers['Trait(s)']);
    var cycle = getCurrentCycle_();

    if (!cycle) {
      logError_('onFormSubmit', 'CURRENT_CYCLE is not set - scoring this submission with a blank Cycle. Run "Set Current Cycle..." from the menu.');
    }

    if (!studentId) {
      logError_('onFormSubmit', 'Submission had no Student ID.');
      return;
    }

    var student = lookupStudent(studentId);
    if (!student) {
      logError_('onFormSubmit', 'Unrecognized Student ID: "' + studentId + '" - check for a typo against the Roster tab.');
      return;
    }

    traits.forEach(function (trait) {
      scoreOneTrait_(cycle, studentId, student.teacher, week, trait, responseText);
    });
  } catch (err) {
    logError_('onFormSubmit (outer)', err.message || err);
  }
}

function scoreOneTrait_(cycle, studentId, teacher, week, trait, responseText) {
  try {
    var rubric = getRubricForTrait(trait);
    var result = callClaudeForScoring(rubric.text, trait, responseText);

    if (rubric.maxScore && (result.score < 1 || result.score > rubric.maxScore)) {
      logError_(
        'score out of range',
        studentId + ' / ' + trait + ' scored ' + result.score + ' (rubric max is ' + rubric.maxScore + ') - flagged, not blocked.'
      );
    }

    writeResultRow_({
      cycle: cycle,
      studentId: studentId,
      teacher: teacher,
      week: week,
      trait: trait,
      score: result.score,
      rationale: result.rationale_for_teacher,
      strength: result.strength,
      growthArea: result.growth_area,
      studentMessage: result.student_message
    });
  } catch (err) {
    logError_('scoring ' + studentId + ' / ' + trait, err.message || err);
  }
}

/** Collapses a form response event into { "Item Title": answer }. */
function itemResponsesByTitle_(e) {
  var answers = {};
  e.response.getItemResponses().forEach(function (r) {
    answers[r.getItem().getTitle()] = r.getResponse();
  });
  return answers;
}

/** Checkbox items return an array already; guard the single-value case too. */
function normalizeTraits_(raw) {
  if (Array.isArray(raw)) return raw.map(function (t) { return String(t).trim(); }).filter(String);
  return String(raw || '').split(',').map(function (t) { return t.trim(); }).filter(String);
}
