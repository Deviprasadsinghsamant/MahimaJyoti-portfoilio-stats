# Publishing Mahima Jyoti on Google Play

What to upload: **`mj-app/dist/MahimaJyoti-1.0.2.aab`** — version 1.0.2 (versionCode 3),
package `com.mahimajyoti.app`, signed with your upload key. The Cloud Functions it needs are
already deployed.

Work through the parts in order. Parts 1–3 are one-time; part 4 is every release.

---

## 1. Before you start: demo logins for Google's reviewers

Google reviews every release and **needs a working login for each kind of user**. Never give
them a real student's ID or a real teacher's password — set up demo ones in the portal:

1. **A demo class** — *Classes & Sections*: e.g. *Demo (Google review)*, with one or two
   subjects on the *Subjects* page. Keeping the demo apart means real classes and lists aren't
   touched (it will show up as its own class in KPIs; skip it in Annual Promotion).
2. **A demo student** in that class — *Students*: name *Demo Student*, and as contact number a
   mobile the school owns (e.g. the office mobile). Note the **Student ID** the portal gives it
   (e.g. `MJ0999`).
3. **A few results** for the demo student (*Results*), so the reviewer sees marks.
4. **A demo teacher login** — *Staff & Teachers*: a teacher with a phone number and password
   you choose, made **class teacher of the demo class only**. The password must not expire.

Keep these four things for as long as the app is on Play: every update is reviewed again.

## 2. Create the app in Play Console (skip if `com.mahimajyoti.app` already exists)

1. **All apps → Create app.**
   - App name: `Mahima Jyoti`
   - Default language: English (India) — `en-IN`
   - App or game: **App** · Free or paid: **Free**
   - Tick the declarations → **Create app**.
2. The package name is fixed by the first bundle you upload, so upload only
   `MahimaJyoti-1.0.2.aab` (package `com.mahimajyoti.app`).
3. If an earlier app shows `in.mahimajyoti.package`, leave it unpublished or delete it
   (that app → *Settings → Advanced settings → Delete app*). It doesn't affect the new one.

## 3. Dashboard → "Set up your app" (one time)

Answer each task as below, then **Save**.

| Task | Answer |
|---|---|
| **Privacy policy** | `https://mahimajyoti-1df0a.web.app/privacy` |
| **App access** | *All or some functionality is restricted* → **Add instructions** twice (details below) |
| **Ads** | No, my app does not contain ads |
| **Content rating** | Category *Reference, News, or Educational*. Answer **No** to violence, sexual content, language, drugs, gambling, user interaction / sharing content, sharing location and digital purchases. Expect a rating of *3+ / Everyone*. |
| **Target audience** | **18 and over** only. The people using the app are parents and teachers. Don't tick younger ages: that brings in the Families programme rules. |
| **News app** | No |
| **Data safety** | See below |
| **Advertising ID** | No (the app doesn't use it — checked in the build) |
| **Government app / Financial features / Health** | No / None / No |
| **App category** | Education · Contact email: the school's email · Website: `https://mahimajyoti-1df0a.web.app` |

**App access — instructions** (in English, using your demo logins):

- *Parent*: “On the first screen tap **Parent → Sign in**. Student ID: `MJ0999`. Mobile number:
  `<demo student's number>`. Results and Attendance are on the child's screen; tap an exam for
  subject-wise marks.”
- *Teacher*: “On the first screen tap **Teacher → Sign in**. Phone: `<demo teacher phone>`.
  Password: `<demo teacher password>`. Today's attendance for the demo class is on the home
  screen; tap a student's name in a class to see their marks.”

**Data safety** — the honest answers for this app:

- Does your app collect or share user data? **Yes** · Encrypted in transit? **Yes** ·
  Can users create an account in the app? **No** (logins are made by the school).
- Data **collected**, none of it **shared**, all **required**, purpose *App functionality*
  (and *Account management* for phone number and user ID):
  - **Personal info → Phone number** — the parent's mobile (to match the school's record) and
    the teacher's login phone.
  - **Personal info → User IDs** — the teacher's school login.
  - **Device or other IDs** — the notification token used to deliver new marks.
  - **App activity → Other user-generated content** — attendance a teacher marks.
- Nothing else (no location, contacts, photos, analytics or crash reports).

**Main store listing** (Grow → Store presence → Main store listing):

- **Short description** (80 max):
  `Your child's marks and attendance at Mahima Jyoti Awasika Vidyapitha.`
- **Full description**:

  > The official app of Mahima Jyoti Awasika Vidyapitha, Hakimapada, Angul.
  >
  > FOR PARENTS
  > • Sign in with your child's Student ID and the mobile number the school has on record.
  > • See every exam at a glance, and tap one for subject-wise marks — marks out of the total and the percentage for each subject.
  > • Follow attendance on a monthly calendar, with a notification if your child is marked absent.
  > • New marks appear automatically as soon as the school enters them — no need to refresh.
  > • Add brothers and sisters to the same phone.
  >
  > FOR TEACHERS
  > • Sign in with your school website login.
  > • Class teachers take the day's attendance for their class in one go.
  > • Look up any student's marks and attendance.
  >
  > Your child's records come only from the school. The app works offline once loaded.
- **App icon**: `mj-app/store/play-icon-512.png` · **Feature graphic**:
  `mj-app/store/feature-graphic.png`
- **Phone screenshots** (at least 2): signed in as the **demo** student and teacher — the
  Welcome screen, a child's Results list, an exam's subject-wise marks, the attendance
  calendar, the teacher home. Never show a real student.

## 4. Release

### 4a. Internal testing — a quick check on your own phones (optional)

1. **Test and release → Testing → Internal testing → Testers**: create an email list with the
   Gmail addresses of a few staff → **Save**.
2. **Create new release.** On the very first release Play asks about **app signing**: keep
   *Google-generated key* (recommended) — your upload key stays as is.
3. **Upload** `MahimaJyoti-1.0.2.aab`. Release name fills in as `3 (1.0.2)`.
4. **Release notes** (en-IN):

   ```
   • New look: a cleaner, modern design
   • Parent or Teacher: choose from two cards on the first screen
   • Results: one row per exam; tap an exam for subject-wise marks and percentages
   • Attendance: a monthly calendar
   • New marks now appear automatically, even if a notification was missed
   ```
5. **Next → Save and publish.** Share the *Join on Android* link from the Testers tab.

> Anyone who installed the APK file directly must **uninstall it once** before installing from
> Play. Play signs the app with Google's key, so Android sees a different signature.

### 4b. Closed testing — needed before production on newer personal accounts

If your developer account is a **personal** account created after 13 Nov 2023, Google requires
a closed test with **at least 12 testers opted in for the last 14 days** before you can apply
for production. (Organisation accounts skip to 4d.)

1. **Testing → Closed testing → Create track** (or use *Closed testing – Alpha*).
2. **Countries / regions**: India. **Testers**: an email list (or Google Group) with **at
   least 12 people** — teachers and a few parents with Gmail accounts.
3. **Create new release → Add from library →** the 1.0.2 bundle you uploaded → same notes →
   **Next → Save → Send for review**. The first review can take a few days.
4. Send testers the join link. Each one taps **Become a tester**, then installs from Play and
   **actually uses the app** over the 14 days. Google checks engagement, not just the count.
   Keep at least 12 opted in the whole time.

### 4c. Apply for production

After 14 days: **Dashboard → Apply for production**. Answer the questions about how you tested.
Google replies in about a week. If it says no, the closed test simply continues.

### 4d. Production rollout

1. **Production → Countries / regions**: add India.
2. **Create new release → Add from library →** 1.0.2 → release notes → **Next**.
3. **Rollout percentage**: start at **20%**, watch *Quality → Android vitals* and reviews for a
   day or two, then **Increase rollout** to 100%.
4. **Publishing overview → Send changes for review.** Once approved, it's live.

## Every later update

1. Raise `versionCode` (and `version`) in `mj-app/app.json` — see *Publishing on Google Play*
   in `README.md` for the build commands.
2. If Cloud Functions changed, **deploy them first** (older app versions keep working).
3. **Production → Create new release →** upload the new `.aab` → notes → staged rollout as above.
