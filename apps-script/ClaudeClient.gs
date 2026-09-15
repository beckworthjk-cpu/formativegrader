/**
 * Calls the Claude API directly over HTTPS (UrlFetchApp) - Apps Script has
 * no Node/Python runtime, so there's no official Anthropic SDK to use here;
 * this is the raw-HTTP equivalent of it.
 *
 * Structured output (output_config.format) forces a JSON object back, so
 * scoring is never left to hoping the model formats its reply consistently.
 */

function callClaudeForScoring(rubricText, trait, responseText) {
  var apiKey = PropertiesService.getScriptProperties().getProperty('ANTHROPIC_API_KEY');
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not set. Project Settings > Script Properties.');
  }

  var payload = {
    model: CONFIG.CLAUDE_MODEL,
    max_tokens: CONFIG.CLAUDE_MAX_TOKENS,
    system: buildSystemPrompt_(rubricText, trait),
    output_config: {
      effort: CONFIG.CLAUDE_EFFORT,
      format: { type: 'json_schema', schema: buildScoringSchema_() }
    },
    messages: [
      { role: 'user', content: 'Student response to score:\n\n' + responseText }
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
        throw new Error('Claude declined to score this response (refusal).');
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

function buildSystemPrompt_(rubricText, trait) {
  return [
    'You are scoring one high-school student\'s short written response against a single',
    'trait from a department-wide writing rubric. Score strictly against the rubric below -',
    'do not substitute your own general sense of writing quality.',
    '',
    'Trait being scored: ' + trait,
    '',
    'Rubric for this trait (use these exact score levels):',
    rubricText,
    '',
    'Output requirements:',
    '- "rationale_for_teacher" should quote or closely paraphrase specific words from the',
    '  student\'s response to justify the score.',
    '- "strength" and "growth_area" must each name ONE specific, concrete thing, not a vague',
    '  general impression.',
    '- "student_message" is written directly to the student: encouraging, specific, 2-3',
    '  sentences, plain language, no score number or rubric jargon.'
  ].join('\n');
}

function buildScoringSchema_() {
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
