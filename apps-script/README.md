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
Results tab (one row per Cycle × Student ID × Week × Trait)
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
   - Fill in **Roster** (StudentID, Name, Email, Teacher, GradingMode) and
     **Rubric Criteria** (Trait, RubricSource, MaxScore) by hand.
     `RubricSource` can be the full rubric pasted as text, or a Google Doc
     URL — whatever a teacher already uses for hand-scoring works
     unmodified. Leave `GradingMode` blank for normal AI scoring; set it to
     `Hand` for any teacher whose students should never be sent to Claude at
     all (see "Hand-grading opt-out" below).
   - **2. Create Assessment Form** — builds the student-facing Form (Student
     ID, Week, Trait checkboxes pulled from your Rubric Criteria tab,
     Response) and points its responses at this Sheet. Already have a form?
     Skip this and just link its response destination to this Sheet instead.
   - **Manual step, once, on the Form itself**: Settings → Responses →
     "Collect email addresses" → **Verified**. Requires the Form already be
     restricted to your school's accounts (worth doing anyway, to keep
     outside submissions off it). This is what lets `syncVerifiedEmail_`
     auto-fill Roster's Email column and flag ID/email mismatches — not
     required for the pipeline to work, but skip it and that piece silently
     no-ops.
   - **3. Install Form Trigger** — wires `onFormSubmit` so every submission
     scores automatically from then on.
   - **Set Current Cycle...** — enter a label like `Fall 2026`. Every
     submission is stamped with whatever's set here until you change it, so
     "Week 2" from this semester never collides with "Week 2" from a future
     one in the Results tab. It's an admin setting, not a Form field — run
     this once now, and again at the start of each future cycle.
5. The first run of anything that calls an external service (Claude, Gmail)
   will prompt a Google OAuth consent screen — approve it once.

## Adding a new trait later

The Form does **not** stay in sync with the Rubric Criteria tab on its own
after creation, so a new trait needs two steps: add its row to Rubric
Criteria as usual, then run **Sync Trait Choices to Form** from the menu —
it rewrites the live Form's "Trait(s)" checkbox list to match Rubric
Criteria exactly. Don't re-run "Create Assessment Form" for this — that
builds a second, separate Form with its own response destination rather
than updating the existing one.

## Hand-grading opt-out

Some teachers may object to their students' writing being sent to an AI at
all — not just to being scored by it, to it being *transmitted* at all.
Setting a student's `GradingMode` to `Hand` on the Roster tab guarantees
that: the check happens in `onFormSubmit` *before* anything about that
submission is looked up or sent anywhere, so `callClaudeForScoring` is
never reached for that student, full stop.

Their submissions still come in through the same Form and still land in
the same Results tab (one row per trait, same as an AI-scored submission),
so the department stays comparable — but every AI-generated field (AI
Score, AI Rationale, Strength, GrowthArea, StudentMessage) is left blank
except a short note explaining why. The teacher fills in `TeacherHandScore`
by hand once they've graded the paper themselves; that's the row's real
grade. Nothing else needs to change - `GradingMode` is checked per
student, not per teacher, precisely because it's easiest to set the same
value across everyone in a class at once, but it means transfers between
an AI-graded and a hand-graded class are just a one-cell edit.

Two things this deliberately does *not* do, both consistent with keeping
AI out of the loop entirely for these students:
- **No automated feedback email.** With no AI-generated `StudentMessage`,
  `sendPendingStudentEmails` skips these rows rather than sending a blank
  line — the teacher is expected to give feedback themselves. Say if you'd
  rather these students got something automated too; it'd need a different
  mechanism (a place for the teacher to type feedback that isn't AI-written).
- **No Gap comparison.** `Gap` is meaningless with no AI Score to diff
  against — see the formula note below, which accounts for this.

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
- **`Gap` column**: add a formula like `=IF(OR(G2="",I2=""),"",G2-I2)` down
  that column once (G = AI Score, I = TeacherHandScore, given Cycle now
  sits in column B) — it's left blank by the script since `TeacherHandScore`
  is filled in by hand during PLC norming, not by the pipeline. Checking
  *both* sides for blank, not just `I2`, matters once Hand-graded rows
  exist: those have `TeacherHandScore` filled in but `AI Score` always
  blank, and a formula that only checked `I2` would compute a meaningless
  `0 - score` for them instead of leaving Gap blank.
- **`Cycle` is set once via the menu, not per submission.** It's admin
  metadata (which semester/run this belongs to), not something a student
  should have to select correctly on the Form — so it's read from a Script
  Property at scoring time and stamped onto every row automatically.
- **Verified email sync never touches what's sent to Claude.** The Form's
  verified-email capture and `syncVerifiedEmail_` (Roster.gs) only ever
  read/write the Roster tab — the API call in `ClaudeClient.gs` still sends
  exactly `{rubric text, trait, response text}`, unchanged by this feature.
  It's used only to auto-fill a blank Email cell or flag a mismatch against
  what's on file (logged to Errors, not blocked) — never as a replacement
  for Student ID as the actual lookup key.
