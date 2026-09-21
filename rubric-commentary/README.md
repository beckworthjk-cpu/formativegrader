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
You dictate into a Google Doc while grading a stack of papers:
    "Student 14, good use of evidence in paragraph two, but the
     thesis is vague... Student 22, strong organization, needs..."
        │
        ▼  (one Doc per batch of papers / one assignment)
You add a row to the Notes tab: RubricName + that Doc's URL
        │
        ▼  ("Compile Pending Notes" menu action, run when you're ready)
Compile.gs
        │  splits the doc on "Student <number>" markers
        │  for each student: sends {rubric, that student's raw notes} to Claude
        │  Claude organizes them into Strengths / Areas for Growth —
        │  never a score, never an invented observation
        ▼
Commentary tab: one row per student, ready to read while you circle
numbers on your paper rubric
```

## One-time setup

1. Create (or open) the Google Sheet this will live in.
2. **Extensions → Apps Script**. Delete the default `Code.gs`, then create
   each file in this folder with the matching name and paste its contents in
   (or `clasp push` if you use clasp).
3. **Project Settings → Script Properties → Add script property**:
   `ANTHROPIC_API_KEY` = your key.
4. Reload the Sheet. A **Rubric Commentary** menu appears. Run **1. Setup
   Sheets** — creates Roster, Rubric, Notes, Commentary, and Errors tabs.
5. Fill in **Rubric**: one row per assignment — `RubricName` (whatever you'll
   type into Notes to reference it) and `RubricSource` (paste the rubric
   text, or paste a Google Doc URL — same rubric you already use for
   hand-scoring works unmodified).
6. Optionally fill in **Roster** (`StudentID`, `Name`, `Email`) — Name just
   makes the Commentary tab easier to read; Email is only needed for
   students you actually want feedback emailed to (see step 8 below). Skip
   either column, or the whole tab, for students you'll hand papers back to
   in person instead.

## Using it

1. Start a **new Google Doc** for this batch of papers (one doc per
   assignment/grading session — don't reuse the same doc across multiple
   batches, since a Notes row processes the *whole* doc every time and
   there's no way to tell "already-compiled" text apart from new text
   within one doc).
2. Turn on Google Docs' voice typing (**Tools → Voice typing**) and dictate
   as you read each paper. Right before you start talking about a paper,
   say **"Student" followed by their number** — e.g. *"Student 14, good job
   with..."* — that's the marker the script splits on. Everything you say
   until the next "Student ##" is attached to that student.
   - Say the number as digits ("fourteen"), not spelled out — voice typing
     reliably transcribes spoken numbers as digits.
   - Skim the doc afterward for misheard numbers before compiling — much
     faster to fix in the doc than to untangle a wrong match later.
3. Get that Doc's share link (Share → Copy link — anyone with the link,
   viewer, is enough since the script only reads it).
4. In the Sheet's **Notes** tab, add a row: `RubricName` (matching a row in
   Rubric) and `NotesText` = the Doc URL. Leave `Compiled` blank. (You can
   paste text directly into `NotesText` instead of linking a Doc, if you'd
   rather type than dictate for a given batch.)
5. Run **Rubric Commentary → 2. Compile Pending Notes**. It processes every
   Notes row that isn't yet marked `Compiled`, writes one row per student to
   **Commentary** (`Strengths`, `AreasForGrowth` — no score column, on
   purpose), and marks the Notes row `Compiled = TRUE` so re-running the
   menu action never double-processes it.
6. Read the Commentary tab (or print it) alongside your stack of papers and
   a printed rubric — circle the scores yourself, use Claude's write-up as
   the comments you'd otherwise have written in the margins.
7. Type each score into that row's **Score** column — whatever you'd write
   on the paper ("8/10", "17/20", "B+"), exactly as-is, no interpretation.
   A row with no Score yet is treated as not ready, so nothing sends early.
8. When you're ready, run **Send Pending Student Emails**. It emails each
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

Anything that doesn't parse cleanly (a Notes row with no "Student <number>"
markers at all, text before the first marker, an empty chunk, an API
failure for one student) is logged to the **Errors** tab with enough
context to fix and re-run — it never silently drops a student or stops the
rest of the batch.
