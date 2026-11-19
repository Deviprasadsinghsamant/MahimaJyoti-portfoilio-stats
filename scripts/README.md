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

## Put students into their sections

`assign-sections.ts` moves students to the sections in the school's list, without
touching anything else (teachers, logins, other students). Save the list as
`data/sections.xlsx`: a sheet named **NAME & SECTION** with one table per class
side by side — a `CLASS - VIII` title over `NAME OF STUDENT` and `SECTION` columns.

1. `npm run school:sections` — dry run: matches every name (using all the spellings
   from the import), shows section sizes before → after, and lists students who
   aren't in the list (they stay where they are).
2. `npm run school:sections -- --yes` — backs up the affected students and marks
   to `data/backups/`, then moves them.

A moved student's marks move to the new section's subject of the same name.

## Third language (VIII–X)

Sanskrit or Hindi is each student's own choice, so every VIII–X section has both
subjects. The result sheets record one "TLS/H" mark without saying which, so the
import puts it under the language the timetable gives the section (VIII-B and
IX-C: Hindi; other sections: Sanskrit), or the student's choice if the section
sheet's **Third language** column has it. To switch a student, use **Move** on
the Students page, keep the same section, and map Sanskrit → Hindi.

## Student IDs (Mahima Jyoti app)

`npm run school:codes` gives every student without one a permanent Student ID
(`MJ0001`, `MJ0002`, …, numbered by class then name) and sets `counters/studentCode`,
which the portal uses to number students added later. Dry run by default; add
`-- --yes` to write. Existing IDs never change. Parents sign in to the app
(`mj-app/`) with the Student ID and a mobile number on the student's record.

## Demo logins for app-store review

`npm run demo:review` (dry run; `-- --yes` to write, `-- --remove --yes` to delete)
creates what Google Play's reviewers sign in with: *Demo Student* `MJ9001` (parent
mobile `6000000002`) in *Class Demo*, with five subjects, a year of marks and a month of
attendance, and a *Demo Teacher* login (phone `6000000001`), its class teacher.

It's kept apart from the school entirely. Everything is stored in its own collections
(`demoClasses`, `demoSubjects`, `demoStudents`, `demoResults`, `demoAttendance`,
`demoAttendanceSummary`); the teacher login exists only in Firebase Auth (no `users`
profile) with a `demo` claim. The website and the real app read only the school's
collections, so nobody at school sees the demo. The Cloud Functions serve the demo
logins from the demo set only (`mj-func/src/shared/dataSpace.ts`), and the Firestore
rules refuse a demo token. The script checks the IDs and numbers don't clash with real
data, removes any demo records an earlier version left in the school's collections, and
is safe to run again.

The teacher login has **no password** until you set one — run
`npm run demo:review -- --password` in a terminal and type it (it isn't shown or
stored). See `mj-app/PLAY_STORE.md`.

## Keep subjects in step with the timetable

`npm run school:subjects` lists subjects in `school/timetable.ts` that a class in
Firestore doesn't have yet; add `-- --yes` to create them with their timetable
teacher. It never changes or removes existing subjects.

Full marks follow the school's marking scheme (see `maxMarks` in
`school/workbooks.ts`). Absent marks are skipped, not stored as zero.
