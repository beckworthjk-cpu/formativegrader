# Formative Grader — Apps Script pipeline

Scores student CER writing checks against department rubrics via Claude,
logs results to a shared Sheet, and sends students their feedback by email.
Runs entirely inside Google (Forms + Sheets + Apps Script) — no external
server, no separate account to authorize.

## How it fits together

```
Student submits Google Form
        │
        ▼  (onFormSubmit trigger, automatic)
FormTrigger.gs
        │  looks up Student ID → Teacher (Roster tab)
        │  for each Trait selected on the form:
        │      pulls that trait's rubric (Rubric Criteria tab)
        │      calls Claude (ClaudeClient.gs) → {score, rationale, strength,
        │                                        growth_area, student_message}
        │      writes one row to Results
        ▼
Results tab (one row per Student ID × Week × Trait)
        │
        ▼  ("Send Pending Student Emails" menu action, deliberate — not automatic)
Email.gs → combines a student's un-emailed rows for that Week into one email
```

## One-time setup

1. Create (or open) the Google Sheet this will live in.
2. **Extensions → Apps Script**. Delete the default `Code.gs`, then create
   each file in this folder with the matching name and paste its contents
   in (or push with `clasp` if you have it — `clasp push` from this
   directory after `clasp login` and setting `scriptId` in `.clasp.json`).
3. **Project Settings → Script Properties → Add script property**:
   `ANTHROPIC_API_KEY` = your key. Never paste the key directly into the
   code — that's the whole point of Script Properties.
4. Reload the Sheet. A **Formative Grader** menu appears. Run, in order:
   - **1. Setup Sheets** — creates Roster, Rubric Criteria, Results, and
     Errors tabs with headers, and locks the Roster tab to just you (it's
     the only place Student ID and name/email sit next to each other).
   - Fill in **Roster** (StudentID, Name, Email, Teacher) and **Rubric
     Criteria** (Trait, RubricSource, MaxScore) by hand. `RubricSource` can
     be the full rubric pasted as text, or a Google Doc URL — whatever a
     teacher already uses for hand-scoring works unmodified.
   - **2. Create Assessment Form** — builds the student-facing Form (Student
     ID, Week, Trait checkboxes pulled from your Rubric Criteria tab,
     Response) and points its responses at this Sheet. Already have a form?
     Skip this and just link its response destination to this Sheet instead.
   - **3. Install Form Trigger** — wires `onFormSubmit` so every submission
     scores automatically from then on.
5. The first run of anything that calls an external service (Claude, Gmail)
   will prompt a Google OAuth consent screen — approve it once.

## Trying it

Submit a test response through the Form with a Student ID that's in your
Roster. Check the **Results** tab for a new row within a few seconds, or
the **Errors** tab if something went wrong (bad rubric name, missing
roster entry, API error — every failure is logged there with enough
context to fix it, and never silently swallowed).

## Notes on the design choices baked in

- **One Claude call per trait, not per submission.** The Week 12 finale
  selects three traits on the Form and produces three Results rows from
  three calls — each trait has its own rubric, so scoring them separately
  is simpler to reason about than one call juggling three rubrics at once.
- **Real-time scoring (`onFormSubmit`), not a nightly batch.** A single
  short-paragraph scoring call finishes in a couple of seconds, well under
  Apps Script's 6-minute execution cap — no need for the Batch API's
  submit-then-poll pattern here.
- **Score-range validation happens in code, not in the JSON schema** —
  structured outputs don't support `minimum`/`maximum` constraints, so an
  out-of-range score gets logged to Errors as a flag rather than silently
  accepted or blocked.
- **Emailing is a separate, deliberate menu action.** Results land
  automatically; nothing reaches a student's inbox until someone clicks
  "Send Pending Student Emails," so there's a natural review point on the
  Results tab in between.
- **`Gap` column**: add a formula like `=IF(H2="","",F2-H2)` down that
  column once — it's left blank by the script since `TeacherHandScore` is
  filled in by hand during PLC norming, not by the pipeline.
