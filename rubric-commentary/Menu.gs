function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Rubric Commentary')
    .addItem('1. Setup Sheets', 'setupSheets')
    .addItem('2. Compile Pending Notes', 'compilePendingNotes')
    .addToUi();
}
