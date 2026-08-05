# scripts/

One-off maintenance scripts. Runs against real Firebase (not the emulator).

## Setup — one time

1. Firebase Console → Project Settings → **Service accounts** → **Generate new private key**.
2. Save the downloaded JSON as `scripts/service-account.json` (this path is gitignored).
3. `cd scripts && npm install`

## Seed sample data

```
npm run seed
```

Wipes `users`, `classes`, `students`, `subjects`, `attendance`, `results`, `syllabus`,
then repopulates with 7 accounts, 3 classes, 30 students, 15 subjects, ~10 days of
attendance, 2 exam sittings of results, and 5 syllabus docs.

Prints login credentials on completion. Default password for every seed account
is `Password123!` — rotate before demoing to anyone else.
