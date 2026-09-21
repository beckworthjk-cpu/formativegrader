# Rubric Commentary — dictated notes → rubric-checked written feedback

Turns your own spoken grading notes into clean, organized written feedback
per student, checked against a rubric — **without ever assigning a score**.
You still score each paper yourself, by hand, on a printed rubric; this just
saves you from also having to *write* the comments by hand.

This is a separate, standalone Apps Script project from `apps-script/` in
this repo — its own Spreadsheet, its own Roster/Rubric tabs, nothing shared.
If you're looking for the automated Claude-scores-it-and-emails-students
pipeline, that's the other folder.

## How it works

```
You open a bookmarked Form on your phone, once per student:
    Student ID: 14        (typed/tapped, never spoken)
    Rubric:     Essay 1    (picked from a dropdown, never spoken)
    Notes:      dictated via your keyboard's mic - "good use of
                evidence in paragraph two, but the thesis is vague..."
        │
        ▼  (onFormSubmit trigger, automatic)
FormTrigger.gs
        │  looks up the Rubric text for the rubric you picked
        │  sends {rubric, your notes} to Claude
        │  Claude organizes them into Strengths / Areas for Growth —
        │  never a score, never an invented observation
        ▼
Commentary tab: one row per student, ready to read while you circle
numbers on your paper rubric
```

Only the **Notes** field is ever dictated. Student ID and Rubric are Form
fields you tap/select, so there's no spoken marker for voice-to-text to
mishear (misheard trigger phrases and dropped students is exactly the
failure mode this replaces).

## One-time setup

1. Create (or open) the Google Sheet this will live in.
2. **Extensions → Apps Script**. Delete the default `Code.gs`, then create
   each file in this folder with the matching name and paste its contents in
   (or `clasp push` if you use clasp).
3. **Project Settings → Script Properties → Add script property**:
   `ANTHROPIC_API_KEY` = your key.
4. Reload the Sheet. A **Rubric Commentary** menu appears. Run, in order:
   - **1. Setup Sheets** — creates Roster, Rubric, Commentary, and Errors
     tabs.
   - Fill in **Rubric**: one row per assignment — `RubricName` (what shows
     up in the Form's dropdown) and `RubricSource` (paste the rubric text,
     or paste a Google Doc URL — same rubric you already use for
     hand-scoring works unmodified). Optionally fill in **Roster**
     (`StudentID`, `Name`, `Email`) — Name just makes the Commentary tab
     easier to read; Email is only needed for students you want feedback
     emailed to (see step 4 below). Do this *before* creating the Form so
     its Rubric dropdown starts populated.
   - **2. Create Observation Form** — builds the phone-facing Form
     (Student ID, Rubric dropdown, Notes) and points its responses at this
     Sheet.
   - **3. Install Form Trigger** — wires `onFormSubmit` so every submission
     compiles automatically from then on.
5. Bookmark the Form's **Published URL** (shown in the alert after step 2,
   or Apps Script → your Form → Send → the link icon) on your phone's home
   screen — that's what you'll fill out while grading.
6. The first run of anything that calls an external service (Claude, Gmail)
   will prompt a Google OAuth consent screen — approve it once.

## Adding a rubric later

The Form does **not** stay in sync with the Rubric tab on its own after
creation, so a new rubric needs two steps: add its row to Rubric as usual,
then run **Sync Rubric Choices to Form** from the menu — it rewrites the
live Form's "Rubric" dropdown to match the Rubric tab exactly.

## Using it

1. While grading a paper, open the bookmarked Form on your phone.
2. Type the **Student ID**, pick the **Rubric** for this assignment from the
   dropdown, then tap the mic key on your phone's keyboard in the **Notes**
   field and dictate your observations — rambling is fine, Claude cleans it
   up.
3. Submit. Google Forms keeps the page open for the next response by
   default ("Submit another response") — repeat for the next paper.
4. Check the **Commentary** tab for a new row within a few seconds (or the
   **Errors** tab if something went wrong — bad rubric name, API error,
   empty Notes — every failure is logged there with enough context to fix
   and it never silently drops a submission).
5. Read the Commentary tab (or print it) alongside your stack of papers and
   a printed rubric — circle the scores yourself, use Claude's write-up as
   the comments you'd otherwise have written in the margins.
6. Type each score into that row's **Score** column — whatever you'd write
   on the paper ("8/10", "17/20", "B+"), exactly as-is, no interpretation.
   A row with no Score yet is treated as not ready, so nothing sends early.
7. When you're ready, run **Send Pending Student Emails**. It emails each
   student their Score, Strengths, and AreasForGrowth in one message, using
   the email on file for their Student ID in **Roster** — add `Email` there
   for anyone you want emailed (leave it blank for students you're handing
   the paper back to in person instead). Sent rows are marked
   `Emailed = Y` so re-running the menu action never double-sends.

## What Claude is and isn't asked to do

The prompt (see `ClaudeClient.gs`) explicitly forbids Claude from:
- assigning, implying, or suggesting any score, grade, or rating
- adding any observation, example, or praise you didn't actually say
- commenting on anything your notes don't mention

Its only job is to take what you already said — however rambling the
dictation came out — and turn it into two clean paragraphs (Strengths,
Areas for Growth) using the rubric's own language where it naturally fits.
If your notes for a student are one-sided (all praise, or all critique),
that's fine — the other field just says so rather than inventing balance.

## Errors

Anything that doesn't compile cleanly (missing Student ID, an unrecognized
Rubric name, empty Notes, an API failure) is logged to the **Errors** tab
with enough context to fix and resubmit — it never silently drops a
submission or stops the next one from compiling.
