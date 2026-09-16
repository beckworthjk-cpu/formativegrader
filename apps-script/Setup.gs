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

/**
 * Cycle is an admin label ("Fall 2026", "Spring 2027 - Unit 2"), not a Form
 * field - students never pick it, so it can't be picked wrong. Set it once
 * at the start of each new cycle; every submission until the next change
 * gets stamped with whatever's set here.
 */
function setCurrentCycle() {
  var ui = SpreadsheetApp.getUi();
  var current = PropertiesService.getScriptProperties().getProperty(CONFIG.CYCLE_PROPERTY_KEY) || '(not set)';
  var resp = ui.prompt(
    'Set Current Cycle',
    'Current value: ' + current + '\n\nEnter the label to stamp on new submissions from now on (e.g. "Fall 2026"):',
    ui.ButtonSet.OK_CANCEL
  );
  if (resp.getSelectedButton() !== ui.Button.OK) return;
  var value = resp.getResponseText().trim();
  if (!value) {
    ui.alert('No value entered - Current Cycle left unchanged.');
    return;
  }
  PropertiesService.getScriptProperties().setProperty(CONFIG.CYCLE_PROPERTY_KEY, value);
  ui.alert('Current Cycle set to: ' + value);
}

function getCurrentCycle_() {
  return PropertiesService.getScriptProperties().getProperty(CONFIG.CYCLE_PROPERTY_KEY) || '';
}
