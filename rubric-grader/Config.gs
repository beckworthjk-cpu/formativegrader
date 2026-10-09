/**
 * Central configuration for the standalone Rubric Grader tool. Separate
 * Apps Script project, own Spreadsheet - shares nothing with apps-script/
 * (grades the essay text itself) or rubric-commentary/ (never grades,
 * only organizes your notes) elsewhere in this repo.
 *
 * This one grades based on YOUR dictated reaction to a paper, not the
 * paper's text - Claude never sees the essay, only your narrated
 * assessment of it, which it converts into the rubric's scale.
 */
var CONFIG = {
  SHEET_ROSTER: 'Roster',
  SHEET_RUBRICS: 'Rubric',
  SHEET_RESULTS: 'Results',
  SHEET_ERRORS: 'Errors',

  CLAUDE_MODEL: 'claude-sonnet-5',
  CLAUDE_MAX_TOKENS: 1024,
  CLAUDE_EFFORT: 'medium', // low | medium | high | xhigh | max
  CLAUDE_API_URL: 'https://api.anthropic.com/v1/messages',
  CLAUDE_API_VERSION: '2023-06-01',
  MAX_RETRIES: 3
};

// Name/Email are optional - Name just makes Results easier to read; Email
// is only needed for students you want feedback emailed to.
var ROSTER_HEADERS = ['StudentID', 'Name', 'Email'];

// RubricSource can be pasted rubric text or a Google Doc URL. MaxScore is
// optional - when set, an out-of-range score from Claude gets flagged to
// Errors (not blocked), same as the apps-script/ pipeline.
var RUBRIC_HEADERS = ['RubricName', 'RubricSource', 'MaxScore'];

var RESULTS_HEADERS = [
  'Timestamp', 'RubricName', 'StudentID', 'Name',
  'Score', 'Rationale', 'Strengths', 'AreasForGrowth', 'StudentMessage',
  'Emailed'
];
var ERROR_HEADERS = ['Timestamp', 'Context', 'Message'];
