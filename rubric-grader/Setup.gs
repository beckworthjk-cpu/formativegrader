/**
 * One-time setup, run from the "Rubric Grader" menu in order:
 * Setup Sheets -> fill in Rubric (and optionally Roster) -> Create
 * Grading Form -> Install Form Trigger.
 */

function setupSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  ensureSheet_(ss, CONFIG.SHEET_ROSTER, ROSTER_HEADERS);
  ensureSheet_(ss, CONFIG.SHEET_RUBRICS, RUBRIC_HEADERS);
  ensureSheet_(ss, CONFIG.SHEET_RESULTS, RESULTS_HEADERS);
  ensureSheet_(ss, CONFIG.SHEET_ERRORS, ERROR_HEADERS);
  SpreadsheetApp.getUi().alert(
    'Tabs are set up.\n\n' +
    'Next: add a row to Rubric for each assignment (RubricName + pasted text ' +
    'or a Google Doc URL, MaxScore optional). Roster is optional - fill in ' +
    'Name/Email if you want names in Results and want to email feedback out.\n\n' +
    'Then run "Create Grading Form" and "Install Form Trigger".'
  );
}

/**
 * One submission = one student against one rubric. Student ID and Rubric
 * are picked/typed as Form fields, never dictated - only Notes is meant to
 * be dictated, and it's the ONLY input Claude grades from, so the more of
 * the rubric you talk through out loud, the more accurate the grade.
 */
function createGradingForm() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var form = FormApp.create('Rubric Grader - Grading Intake')
    .setDescription(
      'One entry per student. Pick their Student ID and the Rubric, then ' +
      'dictate your reaction to the paper into Notes, covering every part ' +
      'of the rubric you can - Claude grades from what you say here, not ' +
      'from the essay itself, so anything you don\'t mention it can\'t weigh.'
    );

  form.addTextItem()
    .setTitle('Student ID')
    .setRequired(true)
    .setValidation(
      FormApp.createTextValidation()
        .requireWholeNumber()
        .setHelpText('Enter the student\'s ID number.')
        .build()
    );

  form.addListItem()
    .setTitle('Rubric')
    .setChoiceValues(rubricNamesFromTab_(ss))
    .setRequired(true);

  form.addParagraphTextItem()
    .setTitle('Notes')
    .setRequired(true)
    .setHelpText('Dictate or type your reaction to this student\'s paper, criterion by criterion.');

  form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());

  SpreadsheetApp.getUi().alert(
    'Form created.\n\nEdit URL: ' + form.getEditUrl() +
    '\nPublished URL: ' + form.getPublishedUrl() +
    '\n\nBookmark the Published URL on your phone - that\'s what you\'ll fill ' +
    'out while grading. Don\'t forget "Install Form Trigger" next.'
  );
}

function installFormTrigger() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'onFormSubmit') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('onFormSubmit').forSpreadsheet(ss).onFormSubmit().create();
  SpreadsheetApp.getUi().alert('Form-submit trigger installed - new submissions will now grade automatically.');
}

/**
 * The Form's Rubric dropdown does not stay in sync with the Rubric tab on
 * its own after creation - run this any time a rubric is added, renamed,
 * or removed there.
 */
function syncRubricChoicesToForm() {
  var ui = SpreadsheetApp.getUi();
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var formUrl = ss.getFormUrl();

  if (!formUrl) {
    ui.alert('No Form is linked to this Sheet yet. Run "Create Grading Form" first.');
    return;
  }

  var rubricItem = findRubricListItem_(FormApp.openByUrl(formUrl));
  if (!rubricItem) {
    ui.alert('Could not find a dropdown question titled "Rubric" on the linked Form. Rename your rubric question to exactly "Rubric" and try again.');
    return;
  }

  var names = rubricNamesFromTab_(ss);
  rubricItem.setChoiceValues(names);
  ui.alert('Form Rubric choices updated:\n\n' + names.join('\n'));
}

function findRubricListItem_(form) {
  var items = form.getItems(FormApp.ItemType.LIST);
  for (var i = 0; i < items.length; i++) {
    if (items[i].getTitle().trim() === 'Rubric') return items[i].asListItem();
  }
  return null;
}
