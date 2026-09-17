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
    var respondentEmail = getRespondentEmail_(e);

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

    // Fills Roster's Email if blank, or flags a mismatch - never sent to
    // Claude, this stays entirely inside the Sheet. No-ops if the Form
    // isn't set to collect verified emails.
    syncVerifiedEmail_(studentId, respondentEmail);

    // Some teachers have opted their students out of AI grading entirely.
    // This check happens before anything else in the loop - for a Hand
    // student, callClaudeForScoring is never reached, so their writing
    // never leaves this Sheet, let alone reaches the API.
    var isHandGraded = String(student.gradingMode || '').trim().toLowerCase() === 'hand';

    // Same passage applies to every trait scored this week - one lookup
    // per submission, not per trait. Empty string if this week has no
    // passage-based formative (most CER weeks won't).
    var passageText = isHandGraded ? '' : getPassageText(cycle, week);

    traits.forEach(function (trait) {
      if (isHandGraded) {
        recordHandGradedSubmission_(cycle, studentId, student.teacher, week, trait);
      } else {
        scoreOneTrait_(cycle, studentId, student.teacher, week, trait, responseText, passageText);
      }
    });
  } catch (err) {
    logError_('onFormSubmit (outer)', err.message || err);
  }
}

/**
 * Logs that a submission came in for a Hand-mode student, without ever
 * calling Claude. Same row shape as an AI-scored one so it lives in the
 * same Results tab, but AI Score and everything Claude would have
 * generated are left blank - TeacherHandScore is where the real grade
 * goes, filled in by hand once the teacher scores it on paper.
 */
function recordHandGradedSubmission_(cycle, studentId, teacher, week, trait) {
  writeResultRow_({
    cycle: cycle,
    studentId: studentId,
    teacher: teacher,
    week: week,
    trait: trait,
    score: '',
    rationale: '(Hand-graded - not submitted to AI)',
    strength: '',
    growthArea: '',
    studentMessage: ''
  });
}

function scoreOneTrait_(cycle, studentId, teacher, week, trait, responseText, passageText) {
  try {
    var rubric = getRubricForTrait(trait);
    var result = callClaudeForScoring(rubric.text, trait, responseText, passageText);

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

/** Empty string (not an error) if the Form isn't set to collect verified emails. */
function getRespondentEmail_(e) {
  try {
    return (e.response.getRespondentEmail() || '').trim();
  } catch (err) {
    return '';
  }
}
