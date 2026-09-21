/**
 * Central configuration for the standalone Rubric Commentary tool. This is
 * a separate Apps Script project bound to its own Spreadsheet - it does not
 * share a Roster or Rubric tab with the apps-script/ (formativegrader)
 * project in this repo.
 */
var CONFIG = {
  SHEET_ROSTER: 'Roster',
  SHEET_RUBRICS: 'Rubric',
  SHEET_NOTES: 'Notes',
  SHEET_COMMENTARY: 'Commentary',
  SHEET_ERRORS: 'Errors',

  CLAUDE_MODEL: 'claude-sonnet-5',
  CLAUDE_MAX_TOKENS: 1024,
  CLAUDE_EFFORT: 'medium', // low | medium | high | xhigh | max
  CLAUDE_API_URL: 'https://api.anthropic.com/v1/messages',
  CLAUDE_API_VERSION: '2023-06-01',
  MAX_RETRIES: 3
};

// Name is optional - only used to make the Commentary tab easier to read
// while you're matching rows back to papers. StudentID is the real key.
var ROSTER_HEADERS = ['StudentID', 'Name'];

// RubricSource can be pasted rubric text or a Google Doc URL - same
// paste-it-or-link-it pattern as the other project in this repo.
var RUBRIC_HEADERS = ['RubricName', 'RubricSource'];

// One row per dictation batch (usually: one stack of papers for one
// assignment). NotesText can be pasted text or a Google Doc URL. Compiled
// is set to TRUE once this row has been processed, so re-running "Compile
// Pending Notes" never double-compiles the same batch.
var NOTES_HEADERS = ['Timestamp', 'RubricName', 'NotesText', 'Compiled'];

var COMMENTARY_HEADERS = [
  'Timestamp', 'RubricName', 'StudentID', 'Name', 'Strengths', 'AreasForGrowth'
];
var ERROR_HEADERS = ['Timestamp', 'Context', 'Message'];
