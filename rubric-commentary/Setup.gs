/**
 * One-time setup, run from the "Rubric Commentary" menu in order:
 * Setup Sheets -> fill in Rubric (and optionally Roster) -> Create
 * Observation Form -> Install Form Trigger.
 */

function setupSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  ensureSheet_(ss, CONFIG.SHEET_ROSTER, ROSTER_HEADERS);
  ensureSheet_(ss, CONFIG.SHEET_RUBRICS, RUBRIC_HEADERS);
  ensureSheet_(ss, CONFIG.SHEET_COMMENTARY, COMMENTARY_HEADERS);
  ensureSheet_(ss, CONFIG.SHEET_ERRORS, ERROR_HEADERS);
  SpreadsheetApp.getUi().alert(
    'Tabs are set up.\n\n' +
    'Next: add a row to Rubric for each assignment (RubricName + pasted text ' +
    'or a Google Doc URL). Roster is optional - fill in Name/Email if you ' +
    'want names in the Commentary tab and want to email feedback out.\n\n' +
    'Then run "Create Observation Form" and "Install Form Trigger".'
  );
}

/**
 * One submission = one student against one rubric. Student ID and Rubric
 * are picked/typed as Form fields, never dictated - only Notes is meant to
 * be dictated - so there's no spoken marker for voice-to-text to mishear.
 */
function createObservationForm() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var form = FormApp.create('Rubric Commentary - Observation Intake')
    .setDescription(
      'One entry per student. Pick their Student ID and the Rubric, then ' +
      'dictate your notes into Notes using your keyboard\'s mic.'
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
    .setHelpText('Dictate or type your observations about this student\'s paper.');

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
  SpreadsheetApp.getUi().alert('Form-submit trigger installed - new submissions will now compile automatically.');
}

/**
 * The Form's Rubric dropdown does not stay in sync with the Rubric tab on
 * its own after creation - run this any time a rubric is added, renamed, or
 * removed there. Replaces the whole choice list rather than merging, so
 * Rubric stays the single source of truth for what shows up on the Form.
 */
function syncRubricChoicesToForm() {
  var ui = SpreadsheetApp.getUi();
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var formUrl = ss.getFormUrl();

  if (!formUrl) {
    ui.alert('No Form is linked to this Sheet yet. Run "Create Observation Form" first.');
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
