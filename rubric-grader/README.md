# Rubric Grader — your dictated reaction → a rubric-matched grade

A Form tied to a rubric, grading automatically from your own spoken
reaction to a paper, logging to a Sheet, and emailing the student when
you're ready.

**This is the one tool in this repo where Claude assigns the actual
grade** — but it never reads the student's essay. It only reads *your*
dictated judgment of it, and converts that into the matching score on the
rubric. That makes it fundamentally different from its two siblings here:

- `apps-script/` — Claude reads the student's **writing itself** and
  scores that.
- `rubric-commentary/` — Claude reads **your notes** but never scores
  anything; you circle the grade yourself on paper.
- `rubric-grader/` (this one) — Claude reads **your notes** and turns
  them into the grade, because you dictate a full, criterion-by-criterion
  reaction rather than just a few observations.

**The grade is only as good as your dictation.** If you don't address a
rubric criterion out loud, Claude has nothing to grade it on - it'll say
so in the Rationale rather than silently inventing a level, but the fix is
on your end: talk through every part of the rubric before submitting.

## How it works

```
You open a bookmarked Form on your phone, once per student:
    Student ID: 14        (typed/tapped, never spoken)
    Rubric:     Essay 1    (picked from a dropdown, never spoken)
    Notes:      dictated via your keyboard's mic - work through every
                criterion: "Thesis is clear and arguable... evidence
                is solid in paragraph 2 but thin in paragraph 3...
                mechanics are clean throughout..."
        │
        ▼  (onFormSubmit trigger, automatic)
FormTrigger.gs
        │  looks up the Rubric text for the rubric you picked
        │  sends {rubric, your notes} to Claude
        │  Claude matches your own judgment to the rubric's levels and
        │  returns a score, rationale, strength, growth area, and a
        │  student-facing message
        ▼
Results tab: one row per student, grade already filled in
        │
        ▼  ("Send Pending Student Emails" menu action, deliberate)
Email.gs → sends that student their score + feedback
```

## One-time setup

1. Create (or open) the Google Sheet this will live in.
2. **Extensions → Apps Script**. Delete the default `Code.gs`, then create
   each file in this folder with the matching name and paste its contents
   in (or `clasp push` if you use clasp).
3. **Project Settings → Script Properties → Add script property**:
   `ANTHROPIC_API_KEY` = your key.
4. Reload the Sheet. A **Rubric Grader** menu appears. Run, in order:
   - **1. Setup Sheets** — creates Roster, Rubric, Results, and Errors
     tabs.
   - Fill in **Rubric**: one row per assignment — `RubricName` (what shows
     up in the Form's dropdown), `RubricSource` (paste the rubric text, or
     a Google Doc URL), and optionally `MaxScore` (if set, a score outside
     1–MaxScore gets flagged to Errors, not blocked - the same safety net
     the other AI-scoring pipeline in this repo uses). Optionally fill in
     **Roster** (`StudentID`, `Name`, `Email`) for anyone you want graded
     feedback emailed to. Do this *before* creating the Form so its Rubric
     dropdown starts populated.
   - **2. Create Grading Form** — builds the phone-facing Form (Student
     ID, Rubric dropdown, Notes) and points its responses at this Sheet.
   - **3. Install Form Trigger** — wires `onFormSubmit` so every submission
     grades automatically from then on.
5. Bookmark the Form's **Published URL** (shown in the alert after step 2)
   on your phone's home screen.
6. The first run of anything that calls an external service (Claude,
   Gmail) will prompt a Google OAuth consent screen — approve it once.

## Adding a rubric later

Run **Sync Rubric Choices to Form** after adding/renaming/removing a row in
Rubric — the Form's dropdown doesn't update on its own.

## Using it

1. While grading a paper, open the bookmarked Form on your phone.
2. Type the **Student ID**, pick the **Rubric**, then tap the mic key on
   your phone's keyboard in **Notes** and talk through your reaction to
   the paper — ideally touching every criterion the rubric lists. Thin
   coverage of a criterion means a thin basis for grading it.
3. Submit. Forms keeps the page open for the next response by default -
   repeat for the next paper.
4. Check **Results** for a new row within a few seconds, with the grade
   already filled in - or **Errors** if something went wrong (bad rubric
   name, API error, a score outside MaxScore, empty Notes).
5. When you're ready to release grades, run **Send Pending Student
   Emails**. It emails each student their Score, the student-facing
   message, Strengths, and AreasForGrowth, using the email on file in
   **Roster**. Sent rows are marked `Emailed = Y` so re-running never
   double-sends.

## What Claude is and isn't doing

The prompt (see `ClaudeClient.gs`) is explicit that Claude has not read
and will never read the essay - only your dictated reaction to it. It:
- matches your own stated judgment to the rubric's levels, rather than
  forming an independent opinion of the writing
- quotes/paraphrases your actual words in the rationale, tied to the
  specific rubric level it picked
- calls out in the rationale any criterion your notes didn't address,
  rather than inventing a specific strength or flaw you never mentioned
- writes a short student-facing message with no score number or rubric
  jargon in it (the score itself goes in the email as its own line)

## Errors

Anything that doesn't grade cleanly (missing Student ID, an unrecognized
Rubric name, empty Notes, an out-of-range score, an API failure) is logged
to the **Errors** tab with enough context to fix and resubmit - it never
silently drops a submission or stops the next one from grading.
