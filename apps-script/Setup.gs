/**
 * One-time setup actions, run from the "Formative Grader" menu in order:
 * Setup Sheets -> fill in Roster + Rubric Criteria -> Create Assessment
 * Form (or link an existing one) -> Install Form Trigger.
 */

function setupSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  ensureSheet_(ss, CONFIG.SHEET_ROSTER, ROSTER_HEADERS);
  ensureSheet_(ss, CONFIG.SHEET_RUBRICS, RUBRIC_HEADERS);
  ensureSheet_(ss, CONFIG.SHEET_RESULTS, RESULTS_HEADERS);
  ensureSheet_(ss, CONFIG.SHEET_ERRORS, ERROR_HEADERS);
  protectRosterSheet_(ss);
  SpreadsheetApp.getUi().alert(
    'Tabs are set up.\n\n' +
    'Next: fill in the Roster and Rubric Criteria tabs, then run ' +
    '"Create Assessment Form" (or link an existing Form\'s destination to this sheet).'
  );
}

/** Restricts the Roster tab to the sheet owner - the only tab where Student ID meets Name/Email. */
function protectRosterSheet_(ss) {
  var sheet = ss.getSheetByName(CONFIG.SHEET_ROSTER);
  var existing = sheet.getProtections(SpreadsheetApp.ProtectionType.SHEET);
  if (existing.length > 0) return; // already protected, don't reset editor list on re-run
  var protection = sheet.protect().setDescription('Roster - restricted: contains names/emails');
  protection.removeEditors(protection.getEditors());
  if (protection.canDomainEdit()) protection.setDomainEdit(false);
}

function createAssessmentForm() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var form = FormApp.create('Writing Formative Submission')
    .setDescription('Enter your assigned Student ID exactly as given. Do not put your name anywhere on this form.');

  form.addTextItem()
    .setTitle('Student ID')
    .setRequired(true)
    .setValidation(
      FormApp.createTextValidation()
        .requireTextMatchesPattern('^[0-9]{3}$')
        .setHelpText('Enter your 3-digit Student ID.')
        .build()
    );

  var weeks = [];
  for (var w = 1; w <= 12; w++) weeks.push(String(w));
  form.addListItem().setTitle('Week').setChoiceValues(weeks).setRequired(true);

  form.addCheckboxItem()
    .setTitle('Trait(s)')
    .setChoiceValues(traitNamesFromRubricTab_(ss))
    .setRequired(true)
    .setHelpText('Select every trait being scored this week - see the assignment instructions.');

  form.addParagraphTextItem().setTitle('Response').setRequired(true);

  form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());

  SpreadsheetApp.getUi().alert('Form created.\nEdit URL: ' + form.getEditUrl() + '\nPublished URL: ' + form.getPublishedUrl());
}

function traitNamesFromRubricTab_(ss) {
  var sheet = ss.getSheetByName(CONFIG.SHEET_RUBRICS);
  var fallback = ['Claim Clarity', 'Evidence Selection', 'Reasoning & Warrant'];
  if (!sheet || sheet.getLastRow() < 2) return fallback;
  var col = headerMap_(sheet);
  var names = sheet.getRange(2, col['Trait'] + 1, sheet.getLastRow() - 1, 1)
    .getValues()
    .map(function (r) { return String(r[0]).trim(); })
    .filter(String);
  return names.length ? names : fallback;
}

function installFormTrigger() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'onFormSubmit') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('onFormSubmit').forSpreadsheet(ss).onFormSubmit().create();
  SpreadsheetApp.getUi().alert('Form-submit trigger installed - new submissions will now score automatically.');
}
