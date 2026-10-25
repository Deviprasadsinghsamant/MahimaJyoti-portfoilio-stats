# scripts/

One-off maintenance scripts. Runs against real Firebase (not the emulator).

## Setup — one time

1. Firebase Console → Project Settings → **Service accounts** → **Generate new private key**.
2. Save the downloaded JSON as `scripts/service-account.json` (this path is gitignored).
3. `cd scripts && npm install`

## Import the school's data (2026-27)

`seed-school.ts` loads the real school: teachers, classes, sections and subjects
from the timetable (`school/timetable.ts`), and students and marks from the four
result workbooks (Baseline, IA-1, IA-2, SA-1).

Inputs go in `scripts/data/`, which is gitignored because it holds student names
and phone numbers:

```
data/results/BASELINE TEST.xlsx
data/results/IA - I.xlsx
data/results/IA - 2.xlsx
data/results/SUMMATIVE ASSESEEMATE - 1.xlsx
```

Steps:

1. `npm run school:prepare` — writes `data/student-sections.xlsx`: one row per
   student, built by matching the different spellings of their name across the
   four workbooks. Read the **Note** column for matches that need checking.
2. Fill in **Section** for every student (and **Third language** in IX-A).
   Write `LEFT` for students who are no longer at the school.
3. `npm run school:check` — dry run. Lists students per section and results per
   exam, and every problem (unmatched names, missing sections, marks above full
   marks). Writes nothing.
4. `npm run school:apply -- --yes` — backs up the current Firestore data and
   logins to `data/backups/`, deletes everything except the admin login
   `+91 9000000001` (renamed "Principal"), then seeds. Teacher logins get
   placeholder phone numbers and one temporary password, written to
   `data/teacher-logins.csv`; replace the numbers on Staff & Teachers.

Re-running `apply` starts over from the same inputs.

Full marks follow the school's marking scheme (see `maxMarks` in
`school/workbooks.ts`). Absent marks are skipped, not stored as zero.
