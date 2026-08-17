---
name: ddodun-weekly-workout
description: Use when adding a new week of DDODUN CrossFit workout data from the coach's weekly image into Supabase — e.g. "6월 N주차 운동 데이터 넣어줘", importing the MON~FRI 운동 이미지 from exercise/ into the ddodun.workout_templates table. Project at /Users/chacha/lab/ddodun.
---

# DDODUN Weekly Workout Import

## Overview

Every week the coach posts one image with 5 columns (MON~FRI). This skill turns that
image into validated rows in `ddodun.workout_templates`, plus the `programs` /
`program_versions` / `program_version_templates` / `program_assignments` rows that make
those templates visible to athletes (`insert.mjs` does both — see "Program layer" below).
**Core principle: the coach image is the source of truth, the `weekN-templates.sql` file
is the auditable artifact, and every row is machine-validated against the real
`parseDescription` renderer before it touches the DB.** Never eyeball-and-insert —
generate SQL, run `validate.mjs`, then insert.

## When to use

- "6월 N주차 / N주차 운동 데이터(SQL) 넣어줘", a weekly image dropped in `exercise/`
- Any request to add/import a week of MON~FRI workouts for the ddodun tracker

## Key files (paths relative to repo root `/Users/chacha/lab/ddodun`)

| What | Path |
|------|------|
| This week's image | `exercise/<N>월 <N>주차.jpeg` (combined; header shows date range like `06.08~06.12`) |
| Prior week SQL (copy formatting) | `app/docs/sql/week*-templates.sql` — use the **latest** as your template |
| Renderer (classification truth) | `app/src/components/workout/WorkoutSection.tsx` (`parseDescription`) |
| Rendering rules doc | `app/docs/prd.md` §7 "운동 이미지 → UI 렌더링 규칙" |
| Hard-won gotchas | memory `feedback_ddodun_workout_data.md` — **read it every time** |
| Supabase creds | `app/.env.local` (`SUPABASE_SERVICE_ROLE_KEY`, schema `ddodun`) |
| Scripts | `app/.claude/skills/ddodun-weekly-workout/scripts/{crop-days,validate,insert}.mjs` (real files, tracked in app repo) — symlinked at outer `.claude/skills/` so it's discovered when CWD is the ddodun root |

Week numbering: file `weekN` is sequential, NOT the calendar week. The latest file +1
is this week (e.g. 6월 1주차 = week14 → 6월 2주차 = week15). Dates come from the image header.

## Workflow

1. **Read the image, one day at a time.** If the user attaches per-day crops, Read those. Otherwise **split the combined sheet first** — `node .claude/skills/ddodun-weekly-workout/scripts/crop-days.mjs "exercise/<N>월 <N>주차.jpeg"` — then `Read` each printed crop individually. The combined sheet is only ~1400px wide, so each of the 5 columns is tiny and error-prone; the per-day crops are isolated and upscaled, so you won't mis-attribute a section to the wrong day. Note the date range and verify weekday↔date with `date -j -f "%Y-%m-%d" "<date>" "+%a"`.
2. **Read the latest `weekN-templates.sql`** — it is your formatting template (escaping, `— into —`, workout_type values, comment header). Also (re)read `feedback_ddodun_workout_data.md` and prd §7.
3. **Check for duplicates**: query existing rows for the target dates (the inserter does this too, but check early).
4. **Transcribe each day section-by-section into a new `weekN-templates.sql`**, one `INSERT … VALUES` block per day, applying the [classification rules](#classification-cheat-sheet) and [pitfalls](#critical-pitfalls) below.
5. **Validate**: `node .claude/skills/ddodun-weekly-workout/scripts/validate.mjs app/docs/sql/weekN-templates.sql`. It prints the exact group/line classification — **read every section against that day's crop** (from step 1) and confirm `problems: 0`. Fix and re-run until clean.
6. **Insert**: `node .claude/skills/ddodun-weekly-workout/scripts/insert.mjs app/docs/sql/weekN-templates.sql`. It parses the SQL (single source of truth), POSTs JSON to Supabase, re-queries to confirm the row count, **and then builds the program layer** (see below) so the rows are actually visible to athletes — this is not a separate manual step.
7. **Report**: per-day row counts, any section-letter reassignments or typo fixes, the verified DB count, and the program(s) created/reused. Commit the SQL file to the app repo if the user wants.

## Program layer (why a bare template insert is not enough)

Athletes never read `workout_templates` directly. `src/lib/server/programs.ts` `resolveTemplates`
only returns a template if it is linked, via `program_version_templates`, to a `program_versions`
row that is assigned (`program_assignments`) to that athlete. `insert.mjs` therefore also creates,
for every Monday its batch covers:

1. a `programs` row (`coach_id` = the sole `role='coach'` user, `week_start_date` = that Monday,
   `title = '<week_start_date> 주간'`),
2. a `program_versions` row (`version_no` 1, `status` `'published'`),
3. `program_version_templates` links for every inserted row with `extra_group_id IS NULL`,
4. `program_assignments` for every `role='athlete'` user.

**Idempotency**: before writing anything, the script checks whether a `programs` row already
exists for a covered week. Without `--force` it aborts the entire run (no templates inserted
either) rather than risk a second program for the same week. With `--force` it reuses the
existing program/version — linking the newly inserted templates and topping up any missing
athlete assignments — instead of creating a duplicate. It never creates two programs for one week.

If you ever need to insert templates *without* going through `insert.mjs` (you shouldn't), you
must still create this layer by hand, or the rows will silently never appear for any athlete —
no error, just an empty calendar day.

## Classification cheat-sheet

A row is `(date, day_of_week, section, workout_type, title, description, sort_order)`.
`description` is a Postgres `E'…'` string; lines joined with `\n`. Each line is classified
by `parseDescription` in this priority (first match wins, setInfo only once per template):

| Line pattern | Becomes | Notes |
|---|---|---|
| `N Sets`, `Every …`, `EMOM N`, `AMRAP N`, `N rounds`, `for time…`, `accumulate …`, trailing `(M:SS)` | **setInfo** (grey header) | only the FIRST match |
| `N x M` | **setInfo** if exactly **1** such line in the template, else **note** |
| `N-N-N` (e.g. `21-15-9`) | **setInfo** if exactly 1, else note; `N rounds for…` → subheader |
| line after setInfo starting `(` | merged into setInfo with `·` | e.g. `5 rounds · (3 min On / 1 min Off)` |
| starts `*`, `@`, `- Rest`, `Rest …`, `+` | **note** (italic, attaches to prev exercise) | |
| anything else | **exercise** (own row + lb button) | |

`title` rules: `AMRAP N` / `EMOM N` / `ENmom` / `For time…` → **section title** (header label,
description lines = exercises). A plain lift name (`Back Squat`, `Bench Press`, `Snatch Deadlift`)
→ exercise row + lb button; put its set scheme in `description`. Otherwise `title = NULL`.

`workout_type` ∈ `weightlifting | strength | metcon | accessory | cardio | skill` (match the movement; mirror prior weeks).

## Critical pitfalls

- **Section letters MUST be sequential per day.** If the image skips or repeats a letter (e.g. THU jumps A,B,C,D,**F**), reassign sequentially (F→E). `validate.mjs` flags non-sequential letters.
- **Multiple groups in one section** (image uses `- into -`, `— into —`, `* and then,`, or `Rest …` between blocks): make one row per group, same `section`, incrementing `sort_order`. The 2nd+ row's description **must start with a leadingRest line** so it gets its own result/memo panel:
  - normalize `- into -` / `-into-` → **`— into —`** (em-dash; first line of the row)
  - **`* and then,`** — the `*` is mandatory; without it "and then," parses as an exercise and the group won't split.
- **Apostrophes** in `E'…'` must be doubled: `3's Descent` → `3''s Descent`, `2's Pause` → `2''s Pause`. (The JSON inserter decodes `''`→`'`.)
- **Set/rep schemes are setInfo, not exercises** — `30-20-10 reps`, `5 rounds for time of :` go in title or as the first/setInfo line, never as a plain movement line.
- **`For time of :` + rep scheme on the next line → merge into ONE line.** The image often prints
  `For time of :` and `21-15-9-15-21` on separate lines. Do **not** transcribe them as two lines, and do
  **not** put `For time of :` in `title`:
  - `title='For time of :'` + `description` starting `21-15-9-15-21` → the section header shows the title
    and the setInfo is rendered **nowhere** (the block that draws it only runs for the 2nd+ group).
    The rep scheme silently disappears. `validate.mjs` now flags this combination.
  - `title=NULL` + two separate lines → the scheme becomes a plain exercise row with a pointless lb button.
  - **Correct:** `title=NULL`, first description line `For time of : 21-15-9-15-21`. It matches
    `/^for\s+time/i`, so the whole thing becomes the grey header. Same for `AMRAP N` / `EMOM N` with a
    trailing scheme.
- **`AMRAP N` is setInfo, never an exercise name.** Standalone `AMRAP 6` → grey setInfo (parser has `/^amrap\s+\d/i`). But if a prior setInfo (e.g. `6 Sets`) already claimed the slot, wrap as `(AMRAP 2)` on the next line so it merges → `6 Sets · (AMRAP 2)` (week13 `5 Sets\n(AMRAP 2:30 / Rest 1:30)`). Section-leading AMRAP may instead be `title='AMRAP N'` (section header). **Two AMRAP blocks in one section** (`AMRAP 12 … - Rest 3:00 - … AMRAP 6 …`): split into 2 rows — row2 starts `Rest 3:00`(leadingRest, drop the surrounding dashes so `/^Rest\s+/i` matches) then `AMRAP 6`(group setInfo).
- **Modifiers stay on the movement's line** — `(3's Descent)`, `@ Heavy`, `@ 70~80%` belong on the same line as the movement, not a separate line.
- **Directives are notes** — `Find Heavy Sets`, `Target Under 12:00` → `* Find Heavy Sets` (prefix `*`); conventionally placed AFTER the movement line.
- **A lift "wave" then `— into —` accessory**: row1 `title='Bench Press'` (or Back Squat/Deadlift) with the `1 x 5 @ 65%` etc. lines (they're all `N x` → notes), row2 `title=NULL` starting `— into —\n3 Sets\n…`.
- Use the image's `~` for ranges (`78~83%`, `1~3,`) — matches prior weeks and avoids the `N-N-N` dashRep pattern.
- **Insert is JSON, not raw SQL.** Prior weeks POST JSON via REST (`Content-Profile: ddodun`). `insert.mjs` derives the JSON from the validated `.sql` so the two never drift. Do not hand-run raw SQL.

## Verification checklist (before claiming done)

- [ ] `validate.mjs` prints `problems: 0` and you read each section's output against that day's crop
- [ ] Row counts per day match what you transcribed
- [ ] Every `— into —` / `* and then,` row shows `[NEW GROUP ✓]`
- [ ] Section titles (`AMRAP/EMOM/For time`) show `(SECTION)`; lift names do not
- [ ] `insert.mjs` reports HTTP 201 + matching DB row count on re-query
