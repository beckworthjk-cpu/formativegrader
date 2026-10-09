/**
 * Fires automatically when the Grading Form is submitted. One submission
 * is always exactly one student against one rubric - Student ID and
 * Rubric are picked/typed as Form fields, never dictated, so there's no
 * spoken marker for voice-to-text to mishear. Only the Notes field (your
 * dictated reaction to the paper) is meant to be dictated.
 *
 * A failure on one submission (bad rubric name, transient API error) is
 * logged to the Errors tab and never stops the next submission from
 * grading.
 */

function onFormSubmit(e) {
  try {
    var answers = itemResponsesByTitle_(e);

    var studentId = String(answers['Student ID'] || '').trim();
    var rubricName = String(answers['Rubric'] || '').trim();
    var notes = String(answers['Notes'] || '').trim();

    if (!studentId) {
      logError_('onFormSubmit', 'Submission had no Student ID.');
      return;
    }
    if (!rubricName) {
      logError_('onFormSubmit', 'Submission for Student ID ' + studentId + ' had no Rubric selected.');
      return;
    }
    if (!notes) {
      logError_('onFormSubmit', 'Submission for Student ID ' + studentId + ' had empty Notes - nothing to grade.');
      return;
    }

    gradeOneSubmission_(studentId, rubricName, notes);
  } catch (err) {
    logError_('onFormSubmit (outer)', err.message || err);
  }
}

function gradeOneSubmission_(studentId, rubricName, notes) {
  try {
    var rubric = getRubricByName_(rubricName);
    var result = callClaudeForGrading(rubric.text, notes);

    if (rubric.maxScore && (result.score < 1 || result.score > rubric.maxScore)) {
      logError_(
        'score out of range',
        studentId + ' / ' + rubricName + ' scored ' + result.score + ' (rubric max is ' + rubric.maxScore + ') - flagged, not blocked.'
      );
    }

    writeResultRow_(rubricName, studentId, result);
  } catch (err) {
    logError_('grading Student ID ' + studentId + ' / ' + rubricName, err.message || err);
  }
}

/**
 * Collapses a form-submit event into { "Item Title": answer }. This
 * trigger is installed on the SPREADSHEET (installFormTrigger, in
 * Setup.gs), and that flavor of onFormSubmit event carries `namedValues`
 * (a plain { title: [answer, ...] } map) - not `response` (a FormResponse
 * object), which only a trigger installed directly on the Form gets.
 */
function itemResponsesByTitle_(e) {
  var named = e.namedValues || {};
  var answers = {};
  Object.keys(named).forEach(function (title) {
    var values = named[title];
    answers[title] = Array.isArray(values) ? values[0] : values;
  });
  return answers;
}
