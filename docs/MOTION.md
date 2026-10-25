# Motion

This document describes every animated transition in Booklet, the values it
uses, and where in the code each one lives. The motion was measured frame by
frame from the reference recording (7.5 s, 60 fps, sampled at 10, 30 and 60 fps
around each transition). Times below are seconds into that recording; durations
are what the app uses.

All motion runs on the UI thread with Reanimated shared values. Constants live
in `src/animation/motion.ts`.

## Layout and palette

| Element | Measurement (W = screen width) | Value in code |
| --- | --- | --- |
| Background | vertical gradient `#232125` → `#1a181b` | `colors.bgTop`, `colors.bgBottom` |
| Closed notebook | 0.64 W × 0.90 W, radius ≈ 10, cover `#3d3b3e` | `bookW = 0.62 W`, `bookH = 0.90 W` |
| Open spread | 0.94 W × 1.21 W, horizontal fold at the middle | `spreadW = bookH × 1.04`, `spreadH = 2 × bookW × 0.95` |
| Paper | `#b7b5b9`, darkening to `#949093` at the fold | `colors.paper`, `colors.paperFold` |
| Calendar sheet | inset 8 px, radius 22, `#3c3a3f` | `CalendarSheet` |
| Action pill | ≈ 0.80 W, glossy `#646165` → `#4c4a4d`, split in two | `ActionPill` |
| Vertical centre | the notebook and the open spread share one centre point | `useBookLayout` |

The notebook does not move vertically when it opens: the closed book's centre
and the open spread's centre are the same point on screen. That is what makes
the opening read as one object turning in place.

## 1. Open the notebook (0.43 s → 1.06 s)

The notebook is modelled as a real object: a page block, and a cover hinged on
the spine (left edge). Opening is one progress value `open` 0 → 1.

- **Driver:** `withTiming(1, { duration: 620, easing: bezier(0.45, 0, 0.2, 1) })`.
  Slow start, quick middle, long deceleration.
- **Cover swing:** `rotateY` 0° → −180° over `open` 0 → 0.62, hinged at the
  spine (`transformOrigin: left`), perspective 1200. Measured ≈ 35° at 0.50 s,
  75° at 0.60 s, 150° at 0.73 s, flat at 0.80 s. Past 90° the cover shows its
  inside face (blank paper) and becomes the upper page.
- **Whole-book roll:** `rotateZ` 0° → 90° clockwise across the full progress.
  Measured ≈ 8° at 0.50 s, 25° at 0.63 s, 45° at 0.70 s, 75° at 0.83 s, 90° at
  1.00 s. Because the book turns a quarter, the spine ends up horizontal and the
  spread reads as an upper and lower page.
- **Re-centring:** the pivot slides from the centre of the closed book to the
  spine, so the spread lands centred (`translateX` −bookW/2 → 0, applied in the
  book's own rotated frame).
- **Lift:** a small `rotateX` bump (0° → 10° → 0°, peak at the middle) and a
  scale to 1.04 × 0.95 give the slight lean seen mid-turn.
- **Chrome:** the helper text and Record/Type pill drop 40 px and fade over the
  first 150 ms (ease-in). The heading cross-fades "Here, your dreams come to
  life" → "Browse your dreams" between 0.46 s and 0.73 s; both lines are briefly
  visible on top of each other, as in the recording.
- **Calendar sheet:** rises from below the screen from 0.56 s, settles by 0.80 s
  with a spring (`dampingRatio 0.86`, `duration 520`).
- **Page text:** fades in over the last 140 ms (0.93 s → 1.06 s), once the paper
  is still.
- **Haptics:** medium impact when the cover starts to swing.

## 2. Turn a page (1.33 s → 1.80 s)

Pages turn over the horizontal fold like a flip calendar, with the leaf corner
leading.

- The upper half of the current page is a leaf hinged on the fold. Dragging
  down rotates it `rotateX` 0° → −180° about its bottom edge; its back shows the
  lower half of the next page. Dragging up turns the lower half the other way.
- **Corner peel:** while turning, the leaf also rolls `rotateZ` by up to −9°
  (`sin(π·t)`), so the top-right corner leads, as in the recording where the
  sheet crosses the page diagonally.
- **Shading:** a gradient on the leaf darkens towards 90° (edge-on) and a
  shadow falls on the page underneath, strongest mid-turn.
- **Gesture:** vertical pan; progress = translation / (spread height × 0.55).
  On release the turn completes if progress > 0.35 or the fling is faster than
  600 pt/s, otherwise it falls back. Completion is
  `withTiming(1, { duration: 300, easing: out(cubic) })`, about 470 ms total in
  the recording including the finger travel.
- At the first or last page the leaf rubber-bands (progress × 0.25) and springs
  back.
- **Haptics:** light impact when a turn commits.

## 3. Lift a page into a full-screen card (2.45 s → 2.95 s)

A tap on the spread lifts the page and grows it into a card that fills the
screen. One progress value `expand` 0 → 1,
`withTiming(1, { duration: 520, easing: bezier(0.3, 0, 0.1, 1) })`.

- **Chrome out first** (0 → 0.25): the heading slides up 24 px and fades; the
  calendar sheet drops off the bottom.
- **Lift** (0 → 0.35): the page shrinks slightly (≈ 3 % narrower) as if picked
  up off the book, and the fold shading fades away so the two halves become one
  flat sheet. "Tap to edit" and the page counter fade out; the "⋯" menu button
  fades in.
- **Grow** (0.35 → 1): the card's frame interpolates from the spread's
  rectangle to the full screen (6 px inset, 14 px radius, top under the status
  bar). The entry text grows from 13 px to 17 px.
- **Haptics:** soft impact on lift.

## 4. Drag the card back down (3.40 s → 4.45 s)

- The card follows a downward drag 1:1 (its bottom runs off screen). Released
  below 120 px or faster than 800 pt/s, it collapses; otherwise it springs back.
- **Collapse:** `expand` 1 → 0 with a spring (`dampingRatio 0.86`,
  `duration 560`) while the drag offset eases to 0, so the card shrinks straight
  from wherever the finger left it. The fold shading returns near the end.
- **Chrome back last:** the heading and calendar sheet return 180 ms after the
  collapse starts, with a light overshoot (`dampingRatio 0.7`).

## 5. Close the notebook (5.33 s → 6.05 s)

Closing is the opening played back on a spring, so it ends with the settle seen
in the recording.

- The calendar sheet drops first (≈ 100 ms), and the heading cross-fades back.
- `open` 1 → 0 with `withSpring(0, { dampingRatio: 0.62, duration: 760 })`. The
  cover angle is clamped, so the cover lands shut. The roll (`rotateZ`) is not
  clamped, so the book swings a few degrees past upright and settles back:
  measured ≈ 35° at 5.70 s, 15° at 5.80 s, 5° at 5.90 s, then a small overshoot.
- The lean (`rotateX`) peaks early in the close (the spread tips back before
  it turns), as in the recording.
- The helper text and pill rise back with a spring from 5.50 s.
- **Haptics:** medium impact when the cover lands.

## Other motion

- **Calendar sheet expand:** drag the handle (or tap the month) to grow the
  week strip into the full month. Spring, `dampingRatio 0.9`.
- **Pill press:** each half scales to 0.96 on press-in (120 ms) and springs
  back.
- **Writing and recording sheets:** slide up with the same spring as the
  calendar sheet over a dimmed backdrop.

## Known differences from the recording

- The cover is a flat plane rotating in 3D. It does not bend, and the page block
  has drawn thickness rather than modelled depth.
- Leaf shading during a page turn is a gradient, not a true page curl.
- 3D transforms with perspective render slightly differently on Android and
  iOS; the values above were tuned for Android.
