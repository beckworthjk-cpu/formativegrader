/**
 * Central configuration for the standalone Rubric Commentary tool. This is
 * a separate Apps Script project bound to its own Spreadsheet - it does not
 * share a Roster or Rubric tab with the apps-script/ (formativegrader)
 * project in this repo.
 */
var CONFIG = {
  SHEET_ROSTER: 'Roster',
  SHEET_RUBRICS: 'Rubric',
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
// Email is only needed for students you'll actually email feedback to -
// leave it blank for anyone you hand back papers to in person instead.
var ROSTER_HEADERS = ['StudentID', 'Name', 'Email'];

// RubricSource can be pasted rubric text or a Google Doc URL - same
// paste-it-or-link-it pattern as the other project in this repo.
var RUBRIC_HEADERS = ['RubricName', 'RubricSource'];

// Score is left blank by the script - fill it in by hand once you've circled
// it on your printed rubric. Whatever you type goes into the email as-is
// ("8/10", "17/20", "B+", whatever matches how you actually score), so
// nothing here assigns or infers a score. Emailed is set to 'Y' once
// "Send Pending Student Emails" has sent that row, so re-running it never
// double-sends.
var COMMENTARY_HEADERS = [
  'Timestamp', 'RubricName', 'StudentID', 'Name', 'Strengths', 'AreasForGrowth',
  'Score', 'Emailed'
];
var ERROR_HEADERS = ['Timestamp', 'Context', 'Message'];
