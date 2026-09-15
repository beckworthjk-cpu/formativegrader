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
  MAX_RETRIES: 3
};

var ROSTER_HEADERS = ['StudentID', 'Name', 'Email', 'Teacher'];
var RUBRIC_HEADERS = ['Trait', 'RubricSource', 'MaxScore'];
var RESULTS_HEADERS = [
  'Timestamp', 'StudentID', 'Teacher', 'Week', 'Trait',
  'AI Score', 'AI Rationale', 'TeacherHandScore', 'Gap',
  'Strength', 'GrowthArea', 'StudentMessage', 'Emailed'
];
var ERROR_HEADERS = ['Timestamp', 'Context', 'Message'];
