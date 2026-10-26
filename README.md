# Booklet

A private dream diary for Android, iOS and the web, built with Expo and React Native.

Booklet opens like a real notebook. Tap the cover and it swings open and turns
a quarter turn into a spread of paper pages. Drag the pages to turn them, tap a
page to lift it to full screen, and drag it back down to put it away. A calendar
sheet at the bottom takes you to any day.

Write a dream with **Type**, or speak it with **Record**.

## Privacy

Everything stays on your phone.

- Entries are stored in a local SQLite database (`expo-sqlite`).
- Voice notes are saved as audio files in the app's private document directory.
- There is no network code, no account, no sync, no analytics and no crash
  reporting. The app never sends anything anywhere.
- Android cloud backup is turned off (`allowBackup: false`), so the diary is not
  copied to Google Drive backups either.
- **Settings → Delete all pages** erases every entry and recording from the
  device.

Uninstalling the app removes the diary too, so there is nothing to recover
later.

On the web, the diary lives in your browser's own storage (IndexedDB) for that
site, and voice notes are kept there as audio blobs. Nothing leaves the browser.
Clearing the site's data, or browsing in a private window, erases it.

## Running it

You need Node.js 20 or newer and the **Expo Go** app on an Android phone (Expo
Go for SDK 58).

```bash
npm install
npx expo start
```

Scan the QR code with Expo Go. Phone and computer must be on the same network,
or run `npx expo start --tunnel`.

Every native module the app uses (Reanimated, Gesture Handler, SQLite, Audio,
File System, Haptics, SVG, Linear Gradient) ships inside Expo Go, so no
development build is needed.

### On the web

```bash
npx expo start --web
```

It opens as a normal site: a phone-width column on desktop, full screen on a
phone. Drag with a mouse or a finger, and press Escape to put a page away or
close the book. Record appears only in browsers that allow microphone
recording; haptics are silent on the web.

To publish it, build the static site and upload the `dist/` folder to any
static host (Netlify, Vercel, GitHub Pages, Cloudflare Pages):

```bash
npx expo export --platform web
```

Useful checks:

```bash
npx tsc --noEmit                         # type check (strict)
npx expo-doctor                          # dependency and config check
npx expo export --platform android       # production bundle
npx expo export --platform web           # static web build in dist/
```

## How to use it

| Where | Gesture | What happens |
| --- | --- | --- |
| Home | Tap the notebook | It opens to your newest page |
| Home | **Type** | Writing sheet for a new page |
| Home | **Record** | Records a voice note into a new page |
| Open book | Drag down / up | Turn to an older / newer page |
| Open book | Tap a page | Lift it to full screen (a blank page opens the writing sheet) |
| Full-screen page | Drag down | Put the page back in the book |
| Full-screen page | Tap the text, or **⋯ → Edit** | Edit the page |
| Full-screen page | **⋯ → Delete** | Delete the page and its recording |
| Calendar sheet | Tap a day | Show that day's pages (tap again to show all) |
| Calendar sheet | Drag up, or tap the month | Show the whole month |
| Calendar sheet | ◉ | Jump to today |
| Open book | Tap the heading, the background, or press Back | Close the book |

New pages are dated today, or the day selected in the calendar.

## Motion

The motion was measured frame by frame from a reference screen recording and
rebuilt with Reanimated shared values, so it all runs on the UI thread.
[`docs/MOTION.md`](docs/MOTION.md) has every timing, curve and angle. In short:

- **Open (620 ms).** The cover swings 180° on its spine (`rotateY`, perspective
  1200) while the whole book rolls 90° clockwise and re-centres on the spine.
  The spine ends up horizontal, so the spread reads as an upper and lower page.
  The heading cross-fades, the Record/Type pill drops away, and the calendar
  sheet springs up.
- **Turn.** The upper half of the page is a leaf hinged on the fold. Your finger
  drives `rotateX` 0° → 180°, with a slight corner-first roll and shading that
  peaks when the leaf is edge-on. Past 35 % or on a fling it completes; otherwise
  it falls back.
- **Lift (520 ms).** The page shrinks a little as it leaves the book and its fold
  flattens, then it grows to fill the screen while the heading and calendar
  slide away.
- **Put back.** The card follows your finger down, then springs back into the
  book from wherever you let go. The heading and calendar return last, with a
  little overshoot.
- **Close.** The same model on an under-damped spring, so the book swings a few
  degrees past upright and settles.
- **Haptics.** Medium when the cover starts to swing and when it lands shut,
  light on each page turn, soft when a page lifts, selection ticks in the
  calendar.

## Project layout

```
App.tsx                  fonts, providers, root screen
src/
  animation/motion.ts    measured timings, springs and angles
  audio/storage.ts       voice-note files in the document directory
  components/            notebook, page spread, entry card, sheets, controls
  db/                    SQLite schema, migrations and entry queries
  hooks/                 entries store and shared book geometry
  lib/dates.ts           local-time day keys and formatting
  screens/BookletScreen  the single screen and its state machine
  theme.ts               palette and font names
docs/MOTION.md           motion breakdown
```

## Stack

Expo SDK 58 · React Native 0.88 · TypeScript (strict) · Reanimated 4 with
`react-native-worklets` · Gesture Handler 3 · expo-sqlite · expo-audio ·
expo-file-system · expo-haptics · react-native-svg · expo-linear-gradient ·
Playfair Display and Noto Serif through `@expo-google-fonts`.
