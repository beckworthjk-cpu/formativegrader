/**
 * Calls the Claude API directly over HTTPS (UrlFetchApp) - Apps Script has
 * no Node/Python runtime, so there's no official Anthropic SDK to use here;
 * this is the raw-HTTP equivalent of it.
 *
 * This tool never asks Claude for a score. It only asks it to take one
 * teacher's own raw dictated notes about one student and turn them into
 * clean, organized written feedback, checked against the rubric so nothing
 * the teacher said gets lost or garbled - the teacher still scores the
 * paper themselves, by hand, against a printed rubric.
 */

function callClaudeForCommentary(rubricText, studentNotes) {
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
      format: { type: 'json_schema', schema: buildCommentarySchema_() }
    },
    messages: [
      { role: 'user', content: buildUserMessage_(studentNotes) }
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
        throw new Error('Claude declined to compile these notes (refusal).');
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
    'A teacher is grading a stack of student essays against the rubric below.',
    'While reading each essay, they dictate rough, out-loud notes about it -',
    'informal, sometimes rambling, sometimes just a fragment. Your only job is',
    'to turn ONE student\'s raw notes into clean, organized written feedback for',
    'that student, checked against the rubric so the feedback uses the rubric\'s',
    'own criteria and language where it naturally fits.',
    '',
    'Rubric:',
    rubricText,
    '',
    'Hard rules:',
    '- Do NOT assign, imply, or suggest a score, grade, level, or rating of any',
    '  kind. The teacher scores the paper themselves, by hand, against a',
    '  printed copy of this same rubric - your output must never contain a',
    '  number that could be read as a score.',
    '- Do NOT invent, embellish, or add any observation, example, or praise the',
    '  teacher did not actually say. If the notes only mention one thing, your',
    '  output only mentions that one thing - it is fine for a section to be',
    '  short, or even a single sentence.',
    '- Do NOT comment on anything the notes don\'t address, and don\'t pad with',
    '  generic writing advice.',
    '- DO fix disfluent dictation (false starts, "um", repeated words, garbled',
    '  phrasing) into clear, complete sentences a student could read as',
    '  feedback on their paper.',
    '- If a note is ambiguous or you\'re not sure what the teacher meant, keep',
    '  it close to their original wording rather than guessing at intent.',
    '',
    'Output two fields: "strengths" (what\'s working, per the teacher\'s notes)',
    'and "areas_for_growth" (what needs work, per the teacher\'s notes). Either',
    'field may be a short empty-ish note like "Not mentioned in these notes."',
    'if the teacher\'s dictation genuinely didn\'t cover that side.'
  ].join('\n');
}

function buildUserMessage_(studentNotes) {
  return 'Teacher\'s raw dictated notes about this student\'s essay:\n\n' + studentNotes;
}

function buildCommentarySchema_() {
  return {
    type: 'object',
    properties: {
      strengths: { type: 'string' },
      areas_for_growth: { type: 'string' }
    },
    required: ['strengths', 'areas_for_growth'],
    additionalProperties: false
  };
}
