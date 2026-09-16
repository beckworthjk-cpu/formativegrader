function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Formative Grader')
    .addItem('1. Setup Sheets', 'setupSheets')
    .addItem('2. Create Assessment Form', 'createAssessmentForm')
    .addItem('3. Install Form Trigger', 'installFormTrigger')
    .addSeparator()
    .addItem('Set Current Cycle...', 'setCurrentCycle')
    .addItem('Send Pending Student Emails', 'sendPendingStudentEmails')
    .addToUi();
}
