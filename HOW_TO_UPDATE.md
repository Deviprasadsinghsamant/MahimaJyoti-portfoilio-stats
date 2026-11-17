# How to update the school website

Everything on the public website (**https://mahimajyoti-1df0a.web.app**) — text,
photos, notices, testimonials, faculty, gallery, contact details — is edited from
the **portal**, with no programming and no re-publishing. This guide lists every
editable section, what to put in it, and exactly what photos to upload.

---

## 1. Before you start

**Who can edit:** only **admin** logins (the principal / office). Teachers and staff
don't see these pages.

**Where:** sign in at **/portal/login** → left menu → **Website Content** section:

| Menu item | Edits the public page |
|---|---|
| Messages | *(not a page)* — messages visitors send from the Contact page form; see section 8 |
| Home page | `/` — the front page |
| About page | `/about` |
| Academics page | `/academics` (also the footer's *Programs* links) |
| Admissions page | `/admissions` |
| Faculty profiles | `/faculty` |
| Gallery | `/gallery` |
| Contact details | `/contact` (also the footer and the privacy policy's contact details) |

**The editor pages explain themselves.** You shouldn't need this guide open while
working — every editor page shows:

- a **How this page works** box at the top;
- for each section: what it is, **where it appears** on the website, an **Example**
  of good content, and a badge saying whether it's **shown on the website**,
  **hidden until filled in**, or **showing default text**;
- for lists: a counter such as *"2 notices · aim for 3–6"* (green ✓ when right);
- an **ⓘ** button next to headings and fields — hover over it, or tap it on a phone,
  for fuller guidance;
- under every field, a one-line hint and a placeholder showing the format; text boxes
  count characters so nothing overflows on the website;
- under every photo: the best size and shape for that spot, and a warning if the
  photo you picked is too small or the wrong shape.

**Saving:** click **Save changes** (top right — it also appears in a yellow bar at the
bottom of the screen while you have unsaved changes; the browser warns you if you try
to leave without saving). After saving you see *"Saved — the website is updated."*
New visitors see it at once; anyone who already had the site open sees it within about
5 minutes (or on refresh). **View on website ↗** opens the page you're editing.

**Empty sections are hidden.** If you leave a section blank (for example, no
testimonials), it simply doesn't appear on the website — nothing half-finished or
placeholder is shown. So you can fill the site in gradually.

**First-time setup — suggested order**

1. **Contact page** — address, phone, email, social links, map. *(The footer and the
   privacy policy use these, so do this first.)*
2. **Home page** — banner, pathways, numbers, "why choose us", notices, testimonials.
3. **About page** — introduction, vision, mission, principal's message, facilities.
4. **Academics page** — the class groups and their subjects.
5. **Admissions page** — steps, eligibility, fees.
6. **Faculty profiles** and **Gallery** — with photos.

---

## 2. Photos — what to upload

### 2.1 The rules for every photo

- **File types:** JPG, PNG or WebP. (iPhone photos are converted automatically when
  you pick them.)
- **File size:** anything up to 25 MB can be picked — you **don't need to shrink
  photos yourself**. The portal resizes every photo in your browser to the size that
  slot needs and saves it as a compressed JPG (usually 100–500 KB). This keeps the
  website fast on mobile data and within Firebase's free storage.
- **Resolution:** upload at least the **recommended size** below. The portal warns
  you if a photo is smaller than the **minimum** (it would look blurry) or a different
  **shape** (its edges will be cropped — check the preview).
- **Why these sizes:** each recommendation is about **twice** the largest size the
  photo is drawn at on a computer screen, so it stays sharp on phones and laptops
  with high-density ("retina") screens.

### 2.2 Every photo slot on the website

| Where it appears | Editor → section | Shape | Recommended (px) | Minimum (px) | Orientation | Stored at (longest side) |
|---|---|---|---|---|---|---|
| Home — banner background | Home page → Banner | **16:9** | **1920 × 1080** | 1280 × 720 | Landscape | 1920 px |
| Home — "Why choose us" | Home page → Why choose us | **4:3** | **1200 × 900** | 800 × 600 | Landscape | 1600 px |
| Home — academic pathway card | Home page → Academic pathways | **16:9** | **1200 × 675** | 800 × 450 | Landscape | 1200 px |
| Home — testimonial | Home page → Testimonials | **1:1** | **400 × 400** | 200 × 200 | Square | 400 px |
| About — principal | About page → Principal's message | **4:5** | **800 × 1000** | 480 × 600 | Portrait | 1000 px |
| About — facility | About page → Infrastructure | **4:3** | **1200 × 900** | 800 × 600 | Landscape | 1200 px |
| Faculty card | Faculty profiles | **4:3** | **1200 × 900** | 600 × 450 | Landscape | 1200 px |
| Gallery | Gallery | **4:3** (thumbnail) | **1600 × 1200** | 1024 × 768 | Landscape | 1600 px |

*(These numbers come from `mj-web/lib/portal/imageSpecs.ts`, which is also what the
upload field shows; keep the two in step if the design changes.)*

### 2.3 What makes a good photo for each slot

- **Banner background (16:9):** a wide, uncluttered shot — school building, morning
  assembly, campus from a distance. It is shown **darkened, behind white text** on
  the left, and on phones it's cropped to a tall shape — so keep the main subject
  in the **centre** and avoid photos with their own text or logos.
- **"Why choose us" (4:3):** students learning — a classroom, lab, library, activity.
- **Academic pathway cards (16:9, optional):** one per class group, e.g. primary
  children in class for the *Primary* card. Use similar-looking photos across the
  three cards (same lighting/style) so the row looks consistent.
- **Testimonial (1:1, optional):** head and shoulders, face centred, plain
  background. Shown as a small circle — a close crop works best.
- **Principal (4:5 portrait):** a formal portrait from the chest up, eye level, plain
  or blurred background, good light on the face.
- **Facilities (4:3, optional):** the place itself — library, science lab, computer
  room, hostel, dining hall, playground. Tidy, well lit, shot from a corner to show
  depth.
- **Faculty (4:3 landscape):** head and shoulders **with space on both sides** — the
  card is wider than tall, so a tight portrait gets its top and bottom cut. Use the
  same background and framing for every teacher.
- **Gallery (4:3 landscape):** events, sports, cultural programmes, achievements.
  Thumbnails are cropped to 4:3; visitors who click a photo see it **whole**, so
  slightly larger originals (2000 px+) are welcome — they're resized to 1600 px.

**General tips:** shoot in landscape unless the slot says portrait; use daylight;
hold the phone level; avoid heavy filters, stickers or text on photos; clean the
camera lens.

### 2.4 Permission and privacy (important)

- Get **parents' permission** before publishing photos of students, and **don't
  put students' full names** next to their photos. India's *Digital Personal Data
  Protection Act, 2023* requires verifiable parental consent for children's personal
  data.
- Get each teacher's permission before publishing their photo and qualifications,
  and each person's permission before publishing a testimonial with their name.

---

## 3. Page by page

### 3.1 Home page (`Website Content → Home page`)

Sections in the order they appear on the website:

**Banner** — the first thing visitors see.

| Field | What to write | Advice |
|---|---|---|
| Badge | Small pill above the heading | e.g. *Admissions Open 2026-27*. Leave blank to hide. Keep under 30 characters. |
| Heading — first line | Big white text | e.g. *Nurturing Minds,* (under 25 characters) |
| Heading — second line | Big gold text | e.g. *Shaping Futures* |
| Introduction | One or two sentences under the heading | Who you are, in plain words. Under 160 characters. |
| Background photo | Optional | See 2.2 — 1920 × 1080, 16:9. |

If the heading or introduction is empty, a general welcome line is shown.

**Highlight badges** — small icon + text tiles under the buttons. **4** look best
(2 × 2 on phones, 4 in a row on computers). Text under 25 characters, e.g.
*Residential campus*, *Classes IV – X*, *Experienced teachers*.

**Academic pathways** — cards for each stage of schooling; **3** look best (three
per row). For each card:
- **Title** and **Subtitle** — e.g. *Upper Primary* / *Class VI – VIII*.
- **Icon** and **Colour** (pick from the buttons — see section 5).
- **Link** — the page the card opens, e.g. `/academics#upper-primary` (matches the
  program's *slug* on the Academics page) or just `/academics`.
- **Description** — 1–2 sentences (under 200 characters).
- **Photo** — optional; 1200 × 675 (16:9).

**Numbers strip** — counters on the dark band, up to **4**. Use **real, current**
figures (for example, from the portal: *311 Students*, *18 Teachers*,
*11 Class sections* as of November 2026). *After the number* is optional, e.g. `+`.

**Why choose us** — heading (two lines; the second is gold), a short paragraph,
**4–6** bullet points, one photo (1200 × 900, 4:3) and an optional badge over the
photo (e.g. big text *100%*, small text *Class X pass rate 2026*). Only use real,
checkable claims.

**Notice board** — announcements in two columns; all notices are shown, so keep
the **4–6** latest and delete old ones. For each: **Date** (e.g. *20 Nov 2026*),
**Tag** (*Admissions*, *Exams*, *Holiday*, *Event* — short), **Title** (one line) and
an optional **Link** — a page on the site (`/admissions`) or a full web address
(`https://…`). To link a PDF circular, upload it to Google Drive, set sharing to
*Anyone with the link*, and paste that link.

**Testimonials** — quotes in rows of three, so **3 or 6** look best. Name, role
(e.g. *Parent, Class VIII*), quote of 2–4 sentences (under 300 characters), optional
photo (400 × 400). Only publish with the person's permission.

**Closing banner** — the dark band at the bottom with *Apply Now* / *Contact Us*
buttons: a heading and one sentence. Blank shows a general invitation.

### 3.2 About page (`Website Content → About page`)

| Section | What to write | Advice |
|---|---|---|
| Introduction | The line under the page heading | 1–2 sentences. |
| Vision and mission | Two cards | A short paragraph each. Leave one blank to hide it. |
| Journey / timeline | Year, title, description | Real milestones, **oldest first** (e.g. founding, new building, first Class X batch). |
| Core values | Icon, title, description | 3–6 values, one sentence each. |
| Principal's message | Name, title, message, photo | Shown only once **name and message** are filled in. Message: one paragraph (about 80–120 words). Photo 800 × 1000 portrait. |
| Infrastructure | Icon, title, description, photo | Two cards per row — an **even number** looks tidy. Photo optional, 1200 × 900. |

### 3.3 Academics page (`Website Content → Academics page`)

One entry per stage of schooling (e.g. *Primary — Class IV–V*, *Upper Primary —
Class VI–VIII*, *Secondary — Class IX–X*). These also become the **Programs** links
in the website footer.

| Field | What to write |
|---|---|
| Link id | Filled in automatically from the program name, e.g. `upper-primary`. Used in links (`/academics#upper-primary`). Don't change it after other pages link to it. |
| Icon, Colour | Pick from the lists (section 5). |
| Title, Level | e.g. *Upper Primary*, *Class VI – VIII*. |
| Board | e.g. *Board of Secondary Education, Odisha* — check with the academic office. |
| Description | 2–3 sentences. |
| Features | Bullet points, 3–6. |
| Subjects | Icon + name for each subject taught at that stage. |

This page has no photos.

### 3.4 Admissions page (`Website Content → Admissions page`)

- **Admission process** — **4 or 5 steps** is ideal (fewer feels vague, more feels
  complicated). Each step: a short title (2–4 words), an icon, and one sentence saying
  what the family does, where and when. Steps are numbered automatically in the order
  listed. A typical flow (also shown as a picture on the editor page):

  **1** Enquiry & campus visit → **2** Collect the form → **3** Submit with documents
  → **4** Entrance test / interaction → **5** Fee payment & confirmation

- **Who can apply (eligibility)** — **2–4 cards**, one per entry class or class group
  (e.g. *Class IV entry*, *Class VI entry*, *Class IX entry*), each with one
  requirement per line: age limit, previous report card, transfer certificate, birth
  certificate, Aadhaar copy, photos, entrance test.
- **Fees** — **2–5 rows**, one per class group, e.g. *Class IV – V (tuition + hostel)*
  → *₹ … per year*. A note under the table says fees are indicative; update every
  session.

No photos on this page.

### 3.5 Faculty profiles (`Website Content → Faculty profiles`)

These are the **public** teacher cards on `/faculty` — separate from the teachers'
portal logins. Click **+ Add teacher**; for each person: **full name** (with title if
used, e.g. *Mrs.*, *Dr.*), **role** (e.g. *Senior Mathematics Teacher*),
**subject(s)**, **experience** (e.g. *12 years*), **qualification** (e.g. *M.Sc., B.Ed.*),
**photo** (1200 × 900 landscape — see 2.3), **position** (lower numbers first — e.g.
principal 1, vice-principal 2, …), a **colour if no photo** (behind their initials
until a photo is added) and **Show on the website** (untick when someone leaves, to
hide the card without deleting it). Cards show three per row; ask each teacher's
permission before publishing.

### 3.6 Gallery (`Website Content → Gallery`)

For each photo: the **photo** (1600 × 1200 landscape), a short **title** (caption),
a one-sentence **description**, the **category**, its **position** (lower numbers
first) and **Show on the website** (untick to hide without deleting).

Visitors filter the gallery by category. The editor page shows a card per category
with how many photos are on the website and the target — aim for **25–40 photos in
total**:

| Category | What belongs here | Aim for |
|---|---|---|
| Campus | Buildings, classrooms, hostel, dining hall, grounds — the place itself | 6–10 |
| Events | Annual day, Independence & Republic Day, prize distribution, visits | 6–12 |
| Academics | Classes in progress, labs, library, projects, exhibitions | 4–8 |
| Sports | Sports day, matches, practice, yoga, games period | 4–8 |
| Achievements | Prize winners, trophies, certificates, board toppers (with permission) | 3–6 |
| Cultural | Dance, music, drama, festivals, art and craft | 4–8 |

Upload the best one or two photos of each event, not every shot, and refresh the
gallery each term (hide or delete old photos).

### 3.7 Contact details (`Website Content → Contact details`)

The editor is titled **Contact details** and has one clearly labelled box for each
thing. Fill in what the school uses; blank ones are simply not shown.

| Field | What to enter | On the website |
|---|---|---|
| School address | One line per row: school name, area, district & PIN, state | *Visit Us* card |
| Phone numbers | Office / reception numbers — 10-digit mobile, or landline with STD code (e.g. 06764-234567). **+ Add another number** for more | *Call Us* card — **tap to call** on phones |
| WhatsApp number | A mobile number that answers WhatsApp (optional) | *WhatsApp* card — **tap to open a chat** |
| Email addresses | The official school email; add a second (e.g. admissions) if needed | *Email Us* card — **tap to write an email** |
| Office hours | When parents can call or visit, one line per row (optional) | *Office Hours* card |
| Facebook / Instagram / YouTube / X (Twitter) / LinkedIn | The **full** link to each page the school has (starts with `https://`); leave the rest blank | Round buttons in the footer and on the Contact page |
| Google Maps embed | On Google Maps search the school → **Share** → **Embed a map** → **Copy HTML**, and paste it | Map on the Contact page (a preview appears in the editor) |

The editor warns you if a phone number or email doesn't look complete. These details
also appear in the **footer of every page** and in the **privacy policy**.

---

## 4. What can't be edited here

These are part of the website design; ask the developer to change them:

- Page headings on the inner pages — *A Legacy of Academic Excellence* (About),
  *Every Stage, One Vision* (Academics), *Your Future Starts Here* (Admissions),
  *Meet Our Distinguished Faculty*, *Campus Life In Pictures* (Gallery),
  *Get In Touch* (Contact) — and section titles such as *Notices & Events*.
- The menu, the logo, the *Excellence in Education* tagline, and the colours/fonts.
- The privacy policy text (`/privacy`).

---

## 5. Lists to choose from

**Icons** (pick by name in the icon dropdown — the chosen icon is previewed beside it):
Award, Beaker, Binary, BookOpen, Building2, Calculator, Calendar, Camera, CheckCircle2,
ClipboardCheck, Clock, FileText, Globe2, GraduationCap, Heart, Languages, Lightbulb,
Mail, MapPin, MessageCircle, Palette, Phone, Shield, Star, Target, Trophy, Users,
Facebook, Twitter, Instagram, Linkedin, Youtube.

**Colours** (for pathway cards and programs): Blue, Green, Gold, Orange, Rose,
Purple, Teal, Navy. Pick with the colour buttons — typed colour names aren't
supported.

---

## 6. Housekeeping

- **Keep it current:** remove past notices, update the numbers strip and fees each
  session, and refresh the gallery each term.
- **Removing or replacing a photo** detaches it from the page; the old file stays in
  storage. That's fine — at 100–500 KB per photo, Firebase's free 5 GB holds well
  over ten thousand photos.
- **Free tier:** a visit reads a few small documents and the resized photos; normal
  school traffic stays well within Firebase's free allowance.

## 7. Troubleshooting

| Problem | Fix |
|---|---|
| A section doesn't show on the website | It's hidden while empty — fill it in and **Save changes**. |
| Change not visible yet | Refresh the website page; open tabs update within ~5 minutes. |
| "Upload denied" | Sign in with an **admin** login. |
| Photo looks blurry | Upload a larger original (see the minimum sizes in 2.2). |
| Photo cut off | It's a different shape from the slot — crop it to the slot's shape before uploading, or keep the subject in the centre. |
| Map doesn't show | Paste Google's **Embed a map** HTML (not the normal map link). |

## 8. Messages from the website

Visitors can write to the school with the **"Send Us a Message"** form on the Contact
page (name, phone or email, topic, message). Messages arrive in the portal under
**Website Content → Messages**; the menu shows how many are **unread**.

- **Reply** with the **Call**, **WhatsApp** or **Email** buttons under each message
  (replying marks it as read).
- **Mark as read** once it's dealt with, so the unread count stays meaningful; **Mark
  as unread** to come back to it.
- **Delete** spam or old messages. The newest 100 are listed.
- Check the page regularly — there's no email alert yet. **Check for new messages**
  reloads the list.
- Spam protection: a visitor can send at most 5 messages an hour, and automated bot
  submissions are dropped without being stored.
