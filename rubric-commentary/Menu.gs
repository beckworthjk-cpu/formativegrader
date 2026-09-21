function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Rubric Commentary')
    .addItem('1. Setup Sheets', 'setupSheets')
    .addItem('2. Compile Pending Notes', 'compilePendingNotes')
    .addSeparator()
    .addItem('Send Pending Student Emails', 'sendPendingStudentEmails')
    .addToUi();
}
