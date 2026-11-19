# mj-app — Mahima Jyoti app

Android app (Expo / React Native, iOS-ready) for Mahima Jyoti Awasika Vidyapitha, with
two sides chosen on the first screen: **parents** see their children's marks and
attendance; **teachers** take their class's attendance and look up any student's marks.
Both can be set up on one phone.

Everything is built to make as few Firebase calls as possible, so the school stays in
the free quota: data lives on the phone, updates arrive as push messages, and the
server is called only for sign-in, a finished register, or an explicit refresh.

## Parents

- **Sign in** with a child's **Student ID** (e.g. `MJ0042`, shown on the portal's Students
  page) and **a mobile number on that student's record**. Add brothers and sisters with
  *Add another child*; each child is verified separately.
- Sign-in calls the `parentSync` Cloud Function, which checks the pair (10 wrong attempts
  per Student ID per hour, then it locks for an hour), returns the child's profile, every
  result on record and this year's attendance, and registers this phone's FCM token.
- **Everything is kept on the phone** (AsyncStorage) and shown offline. The app never polls.
- **Updates arrive as push messages**, stored even when the app is closed (background
  handler in `src/lib/background.ts`):
  - new, corrected, moved or deleted marks (`pushResultToParents` trigger), with a notification;
  - each day's register entry (`saveAttendance`), with a notification when the child is
    marked absent — and a "correction" notification that replaces it if that was a mistake.
- **No mark is lost when a push is.** Pushes can go missing (phone off for weeks, the app
  force-stopped by a battery saver, a token that changed while the app was closed). So
  every change to a student is numbered in `parentFeeds/{studentId}`
  (`mj-func/src/domains/parents/feed.ts`) and each push carries its number:
  - the phone keeps the number its copy is complete up to; a skipped number marks the
    child *stale*;
  - when the app is opened (at most every 10 minutes, every minute while stale) it sends
    its numbers in a `parentSync` **check**. Nothing new costs the server one read per
    child; otherwise only the changed marks come back (from a log of the last 100 changes),
    or — when the phone is further behind, or first opens after updating the app — the full
    record, at most once an hour per phone and child;
  - a check from a phone already registered for the child doesn't re-verify the mobile
    number (pushes don't either); it also re-registers a changed FCM token.
- **A child's screen** has two tabs. **Results** lists one short row per exam (overall %,
  date, total marks), filtered by academic year and — when both exist — exams vs subject
  tests. Tapping a row opens that exam: the overall percentage and total on top, the best
  and weakest subject, and every subject's marks out of its total with its percentage.
  **Attendance** is a month calendar (present / absent days, earlier months one tap back)
  plus the year so far. Teachers see the same screens for any student.
- **Refresh** (refresh icon or pull down) is rarely needed. It runs the same check (with the
  mobile number re-verified) and **re-downloads a child's full record at most once every 24
  hours** per phone — enforced by `parentSync`. Pulling again within 30 seconds just says
  "up to date".
- **Remove** a child from the phone on their results screen; pushes for them stop.

## Teachers

- **Sign in** with the same phone number and password as on the school website
  (Firebase Auth, staying signed in). Any portal login works: admin, teacher or staff.
- `teacherSync` downloads the classes, active students and recent registers in one call —
  at sign-in, automatically once a week, or from *Update student list* (at most hourly).
  Search and class lists work from that copy.
- **Attendance**: only a class's **class teacher** sees its register (admins see every
  class). Everyone starts present; tap the absent students; **Save and finalise** sends the
  whole register in **one** `saveAttendance` call. Marking is drafted on the phone, and a
  register saved without internet waits on the phone and is sent automatically later.
  A class teacher takes today's register (or a missed one from the two days before)
  **once** — after that it's final. Only the **principal** (an admin login) can correct a
  register, in the app or on the website; the server enforces this too. If someone else
  saved the register meanwhile, nothing is overwritten — the app shows their version.
- **Marks** include **subject tests** (a test in one subject, numbered per subject —
  "Mathematics Test 3"), entered on the website's Results page like any other exam.
- **Students' marks** are read-only (entered on the website). `teacherStudent` downloads one
  student when opened; the copy is reused for a day.

Backend: `mj-func/src/domains/parents/`, `attendance/` and `teachers/` (keep
`src/lib/types.ts` in step with their types).

## Setup

Requires Node 22.13+ (Expo SDK 58), Java 17 and the Android SDK.

```bash
npm install
# Firebase config for the Android app (git-ignored):
firebase apps:sdkconfig ANDROID 1:958650690307:android:62362616256a664d305736 -o google-services.json
```

## Run and build

```bash
npx expo run:android            # development build on an emulator or USB device
npx expo prebuild -p android    # generate android/ (git-ignored), then:
cd android && ./gradlew assembleRelease   # APK in android/app/build/outputs/apk/release/
```

The app can't run in Expo Go — React Native Firebase needs a development build.

**Windows long paths.** React Native's C++ build nests the full source path inside each
object file path, so from a deep folder like `C:\Users\…\Desktop\StartUp\School Project`
it passes 260 characters. The Ninja bundled with the Android Gradle plugin's default CMake
(3.22.1) can't handle that (`Filename longer than 260 characters`, or
`ninja: error: mkdir(...): No such file or directory`), even with long paths enabled in
Windows. `plugins/withLongPathCmake.js` sets the `android.cmakeVersion` Gradle property to
3.31.6, whose Ninja is long-path aware, so the build works from this folder. It needs:

- Windows long paths on (once per machine, admin PowerShell, then reboot):
  `New-ItemProperty HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem -Name LongPathsEnabled -Value 1 -PropertyType DWORD -Force`
- CMake 3.31.6 in the Android SDK. Gradle installs it on the first build; if it doesn't,
  run `sdkmanager "cmake;3.31.6"`.

Don't edit `android/gradle.properties` by hand — it's regenerated by `expo prebuild`; the
plugin is what keeps the setting. Or skip local builds and use EAS Build
(`npx eas-cli@latest build -p android`).

`app.json` → `expo-build-properties` → `android.kotlinVersion` is `2.3.21`: Firebase's
Android Auth library (firebase-auth 25, used by `@react-native-firebase/auth` 27) is compiled
with Kotlin 2.4, and React Native's default Kotlin 2.2 can't read its metadata
(`Module was compiled with an incompatible version of Kotlin`). Kotlin 2.3 reads one version
ahead, and Expo SDK 58 supports it (with KSP 2.3.x).

`package.json` → `expo.autolinking.android.exclude` keeps react-native-gesture-handler,
-reanimated and -worklets out of the native build. They're optional peers of Expo Router
(drawers, JS tabs, link previews) that this app doesn't use, and leaving them out makes
the APK smaller and the build faster. Remove them from the list if a future screen needs
them.

To point a development build at the local functions emulator (`npm run emulate:functions`
at the repo root), put this in `.env.local`:

```
EXPO_PUBLIC_FUNCTIONS_BASE_URL=http://10.0.2.2:5001/mahimajyoti-1df0a/asia-south1
```

## Publishing on Google Play

Google Play takes an **app bundle** (`.aab`) signed with **your upload key**. Play then
re-signs it with its own app-signing key (Play App Signing), so the upload key only
proves uploads come from you — if it's ever lost, Play Console support can reset it.

**One-time: create the upload key** (keytool comes with the JDK used for builds). Keep the
`.jks` file and its passwords safe and backed up, outside this repository:

```powershell
keytool -genkeypair -v -storetype JKS -keystore C:\Users\<you>\keys\mahimajyoti-upload.jks -alias upload -keyalg RSA -keysize 2048 -validity 10000
```

Then add to your user-level `C:\Users\<you>\.gradle\gradle.properties` (forward slashes):

```properties
MJ_UPLOAD_STORE_FILE=C:/Users/<you>/keys/mahimajyoti-upload.jks
MJ_UPLOAD_STORE_PASSWORD=<keystore password>
MJ_UPLOAD_KEY_ALIAS=upload
MJ_UPLOAD_KEY_PASSWORD=<key password>
```

`plugins/withReleaseSigning.js` makes release builds use that key whenever these are set;
without them they fall back to the debug key (fine for test phones, refused by Play).

`expo.android.blockedPermissions` in `app.json` removes permissions Expo's template adds but
the app never uses (draw over other apps, storage), so Play lists only what's needed:
internet, notifications, vibration and what Firebase messaging requires.

The app is locked to portrait, which Android turns into a *required* portrait-screen
feature; Play refuses to review an app that requires it (it hides the app from tablets,
Chromebooks and Android XR). `plugins/withOptionalPortraitScreen.js` declares the feature
as not required, so phones stay portrait and every device can install it.

The full Play Console walk-through (demo logins for reviewers, store listing, data safety,
testing tracks, rollout) is in [`PLAY_STORE.md`](PLAY_STORE.md).

**Every release:**

1. In `app.json`, raise `expo.android.versionCode` by 1 (Play rejects a repeated number) and
   set `expo.version` to the version shown to users (e.g. `1.0.3`). Deploy any Cloud
   Function changes the new version relies on **before** rolling it out (older app
   versions keep working with newer functions).
2. Build the bundle:
   ```bash
   npx expo prebuild -p android --clean
   cd android && ./gradlew bundleRelease
   ```
   → `android/app/build/outputs/bundle/release/app-release.aab` (all phone CPU types; Play
   delivers each phone only what it needs).
3. Upload it in Play Console (internal / closed testing first, then production).

## Look and feel

Colours come from the logo (navy lettering, orange emblem) and live in
`src/components/theme.ts`, with the score and attendance colours (green / blue / amber /
red). Shared pieces — cards, the navy band at the top of screens, pills, stat tiles, menu
rows — are in `src/components/ui.tsx`. Gradients and shadows use React Native's own
`backgroundImage` and `boxShadow` styles (no extra library). Icons are
[Lucide](https://lucide.dev) (`lucide-react-native`, drawn with `react-native-svg`); add
new ones to `src/components/icons.ts`, which imports each icon on its own so the app
doesn't carry the whole set.

## Icons and store graphics

All made from the school logo: `assets/icon.png` (launcher), `assets/android-icon-foreground.png`
(adaptive icon on white), `assets/logo.png` (in-app), `assets/notification-icon.png` (white
"MJ" — Android shows notification icons as a white shape; `plugins/withNotificationIcon.js`
installs it), and for the Play listing `store/play-icon-512.png` and `store/feature-graphic.png`.

## Privacy policy

`https://mahimajyoti-1df0a.web.app/privacy` (`mj-web/app/privacy/page.tsx`) — the URL for Play
Console, and linked inside the app (welcome screen and both home screens), as Play requires.
Its contact section shows the details entered on the portal under Admin → Contact page. Keep
the policy in step with what the app collects.

## Still needed before the first release

- The school's contact phone and email under Admin → Contact page (the privacy policy shows them).
- iOS: needs an Apple Developer account, an APNs key in Firebase, and `GoogleService-Info.plist`.
