/**
 * Fires automatically when the Observation Form is submitted. One
 * submission is always exactly one student against one rubric - the
 * Student ID and Rubric are picked as Form fields (typed/selected, never
 * dictated), so there's nothing for voice-to-text to mishear about who a
 * note belongs to. Only the Notes field itself is meant to be dictated.
 *
 * A failure on one submission (bad rubric name, transient API error) is
 * logged to the Errors tab and never stops the next submission from
 * compiling.
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
      logError_('onFormSubmit', 'Submission for Student ID ' + studentId + ' had empty Notes - nothing to compile.');
      return;
    }

    compileOneSubmission_(studentId, rubricName, notes);
  } catch (err) {
    logError_('onFormSubmit (outer)', err.message || err);
  }
}

function compileOneSubmission_(studentId, rubricName, notes) {
  try {
    var rubricText = getRubricByName_(rubricName);
    var result = callClaudeForCommentary(rubricText, notes);
    appendCommentaryRow_(rubricName, studentId, result);
  } catch (err) {
    logError_('compiling Student ID ' + studentId + ' / ' + rubricName, err.message || err);
  }
}

/**
 * Collapses a form-submit event into { "Item Title": answer }. This trigger
 * is installed on the SPREADSHEET (installFormTrigger, in Setup.gs), and
 * that flavor of onFormSubmit event carries `namedValues` (a plain
 * { title: [answer, ...] } map) - not `response` (a FormResponse object),
 * which only installable triggers created directly on the Form itself get.
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
