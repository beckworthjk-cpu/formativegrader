function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Rubric Grader')
    .addItem('1. Setup Sheets', 'setupSheets')
    .addItem('2. Create Grading Form', 'createGradingForm')
    .addItem('3. Install Form Trigger', 'installFormTrigger')
    .addSeparator()
    .addItem('Sync Rubric Choices to Form', 'syncRubricChoicesToForm')
    .addItem('Send Pending Student Emails', 'sendPendingStudentEmails')
    .addToUi();
}
