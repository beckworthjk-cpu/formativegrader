/**
 * Calls the Claude API directly over HTTPS (UrlFetchApp) - Apps Script has
 * no Node/Python runtime, so there's no official Anthropic SDK to use here;
 * this is the raw-HTTP equivalent of it.
 *
 * Unlike rubric-commentary/, this tool DOES ask Claude for a score - but
 * Claude never sees the student's essay. It only sees the teacher's own
 * dictated reaction to it, and converts that judgment into the matching
 * level on the rubric. The grade is only as good as how thoroughly the
 * rubric was talked through out loud.
 */

function callClaudeForGrading(rubricText, teacherNotes) {
  var apiKey = PropertiesService.getScriptProperties().getProperty('ANTHROPIC_API_KEY');
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not set. Project Settings > Script Properties.');
  }

  var payload = {
    model: CONFIG.CLAUDE_MODEL,
    max_tokens: CONFIG.CLAUDE_MAX_TOKENS,
    system: buildSystemPrompt_(rubricText),
    output_config: {
      effort: CONFIG.CLAUDE_EFFORT,
      format: { type: 'json_schema', schema: buildGradingSchema_() }
    },
    messages: [
      { role: 'user', content: buildUserMessage_(teacherNotes) }
    ]
  };

  var options = {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': CONFIG.CLAUDE_API_VERSION
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  var lastError = '';
  for (var attempt = 1; attempt <= CONFIG.MAX_RETRIES; attempt++) {
    var resp = UrlFetchApp.fetch(CONFIG.CLAUDE_API_URL, options);
    var code = resp.getResponseCode();
    var body = resp.getContentText();

    if (code === 200) {
      var data = JSON.parse(body);
      if (data.stop_reason === 'refusal') {
        throw new Error('Claude declined to grade this submission (refusal).');
      }
      if (data.stop_reason === 'max_tokens') {
        throw new Error('Response was cut off at max_tokens - raise CONFIG.CLAUDE_MAX_TOKENS.');
      }
      var textBlock = null;
      for (var i = 0; i < data.content.length; i++) {
        if (data.content[i].type === 'text') { textBlock = data.content[i]; break; }
      }
      if (!textBlock) throw new Error('No text block in Claude response: ' + body);
      return JSON.parse(textBlock.text);
    }

    // Retry transient failures only; anything else (400, 401, 404...) is not
    // going to succeed on retry, so fail immediately with the real reason.
    if (code === 429 || code >= 500) {
      lastError = 'HTTP ' + code + ': ' + body;
      Utilities.sleep(1000 * Math.pow(2, attempt)); // 2s, 4s, 8s
      continue;
    }
    throw new Error('Claude API error (HTTP ' + code + '): ' + body);
  }
  throw new Error('Claude API failed after ' + CONFIG.MAX_RETRIES + ' attempts. Last error: ' + lastError);
}

function buildSystemPrompt_(rubricText) {
  return [
    'A teacher has just finished reading one student\'s essay and is dictating',
    'their own reaction to it, criterion by criterion, against the rubric',
    'below. You have NOT read the essay and never will - your only input is',
    'the teacher\'s own spoken judgment of it. Your job is to convert what the',
    'teacher said into the score their own description actually supports on',
    'this rubric.',
    '',
    'Rubric (use these exact score levels):',
    rubricText,
    '',
    'Hard rules:',
    '- Base the score ONLY on what the teacher\'s notes actually say. Do not',
    '  independently judge the essay - you cannot, you haven\'t seen it. If',
    '  the teacher says a criterion is weak, that criterion is weak; your job',
    '  is matching their judgment to the rubric\'s language, not second-',
    '  guessing it.',
    '- If the notes don\'t address a criterion the rubric covers, give the',
    '  benefit of the doubt only where the rest of the notes imply it (e.g.',
    '  generally strong writing implies competent mechanics unless the',
    '  notes say otherwise) - but say explicitly in "rationale_for_teacher"',
    '  which criteria were unaddressed and that the score assumes nothing',
    '  negative was meant by the silence. Never invent a specific flaw or',
    '  strength the teacher didn\'t mention.',
    '- "rationale_for_teacher" should quote or closely paraphrase the',
    '  teacher\'s own words and map them to the specific rubric level chosen.',
    '- "strength" and "growth_area" must each name ONE specific, concrete',
    '  thing the teacher actually said, not a vague general impression.',
    '- "student_message" is written directly to the student: encouraging,',
    '  specific, 2-3 sentences, plain language, no score number or rubric',
    '  jargon.'
  ].join('\n');
}

function buildUserMessage_(teacherNotes) {
  return 'Teacher\'s dictated reaction to this student\'s essay, against the rubric above:\n\n' + teacherNotes;
}

function buildGradingSchema_() {
  // Numerical constraints (minimum/maximum) aren't supported by structured
  // outputs - score-range validation happens after the call, in code.
  return {
    type: 'object',
    properties: {
      score: { type: 'integer' },
      rationale_for_teacher: { type: 'string' },
      strength: { type: 'string' },
      growth_area: { type: 'string' },
      student_message: { type: 'string' }
    },
    required: ['score', 'rationale_for_teacher', 'strength', 'growth_area', 'student_message'],
    additionalProperties: false
  };
}
