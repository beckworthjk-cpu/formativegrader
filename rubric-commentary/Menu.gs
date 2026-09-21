function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Rubric Commentary')
    .addItem('1. Setup Sheets', 'setupSheets')
    .addItem('2. Create Observation Form', 'createObservationForm')
    .addItem('3. Install Form Trigger', 'installFormTrigger')
    .addSeparator()
    .addItem('Sync Rubric Choices to Form', 'syncRubricChoicesToForm')
    .addItem('Send Pending Student Emails', 'sendPendingStudentEmails')
    .addToUi();
}
