## Why

Viewed with a real (admin) account, the reader draws the same fixed "paper" frame for every
lesson regardless of what the lesson actually is, so migrated Funnycode content leaks through as
awkward empty/raw surfaces:

- A "Tài liệu / Link / Submit" lesson whose entire body is a bare `https://drive.google.com/…`
  URL renders as **naked link text** — no card, no "open" affordance, reads as broken.
- A **video-only** lesson renders the player and then an **empty reading Card** (article height
  0) holding only the reaction bar and a "select text to ask AI" hint — with no text to select.
- The content-map rail lists **empty sections** ("Phần 5 · 0/0 bài") that have no lessons.

The reader should adapt its layout to the lesson's content shape.

## What Changes

- **Resource-link lessons**: when a lesson body is essentially just external link(s), render a
  proper resource card per link (icon + source host + "open" action, opens in a new tab) instead
  of raw link text. The "ask AI about a passage" hint is suppressed (nothing to select).
- **Video-only lessons**: skip the empty reading Card entirely — render the player, then the
  reaction bar directly (no blank paper, no meaningless selection hint).
- **Empty sections**: the content-map rail hides sections that have no lessons.

## Capabilities

### Modified Capabilities
- `course-lesson`: the reader adapts its body layout to the lesson content type (resource-link /
  video-only / written), and the content-map omits empty sections.

## Impact

- FE-only, no BE change.
  - `src/components/features/learn/LessonReader/index.tsx` (content-type branching) + new
    `LessonReader/LessonResourceLinks.tsx`
  - `src/components/features/learn/ContentMap/index.tsx` (hide empty sections)
  - `src/messages/{vi,en}.json` (`learn.resource.*`)
- Heuristic: a body is "link-only" when it contains URL(s) and almost no other prose. Written
  lessons and documents render unchanged.
