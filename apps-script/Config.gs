/**
 * Central configuration. Change tab names or model settings here only.
 */
var CONFIG = {
  SHEET_ROSTER: 'Roster',
  SHEET_RUBRICS: 'Rubric Criteria',
  SHEET_RESULTS: 'Results',
  SHEET_ERRORS: 'Errors',

  CLAUDE_MODEL: 'claude-sonnet-5',
  CLAUDE_MAX_TOKENS: 1024,
  CLAUDE_EFFORT: 'medium', // low | medium | high | xhigh | max
  CLAUDE_API_URL: 'https://api.anthropic.com/v1/messages',
  CLAUDE_API_VERSION: '2023-06-01',
  MAX_RETRIES: 3,

  // Script Property key holding the active cycle label (e.g. "Fall 2026").
  // Set via the menu ("Set Current Cycle...") - not a Form field, since it's
  // an admin setting, not something a student should have to pick correctly.
  CYCLE_PROPERTY_KEY: 'CURRENT_CYCLE'
};

// GradingMode: 'AI' (default - blank also means AI) or 'Hand'. Set per
// student row (usually the same value for every row under one teacher).
// 'Hand' means the Claude call is skipped entirely for that student - see
// FormTrigger.gs.
var ROSTER_HEADERS = ['StudentID', 'Name', 'Email', 'Teacher', 'GradingMode'];
var RUBRIC_HEADERS = ['Trait', 'RubricSource', 'MaxScore'];
var RESULTS_HEADERS = [
  'Timestamp', 'Cycle', 'StudentID', 'Teacher', 'Week', 'Trait',
  'AI Score', 'AI Rationale', 'TeacherHandScore', 'Gap',
  'Strength', 'GrowthArea', 'StudentMessage', 'Emailed'
];
var ERROR_HEADERS = ['Timestamp', 'Context', 'Message'];
