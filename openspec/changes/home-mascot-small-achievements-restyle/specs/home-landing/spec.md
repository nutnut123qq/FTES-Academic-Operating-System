# home-landing

## ADDED Requirements

### Requirement: Home mascot greeting is a small one-liner below Continue learning
The FrosTES mascot greeting (`HomeMascotGreeting`) on the Home landing SHALL render as a
small, subtle inline row — a `sm`-size mascot beside a single short greeting line — NOT a
large speech-bubble banner occupying its own band. The greeting line SHALL show a signed-in
"welcome back, {name}" (name-less fallback when no name) and a guest fallback, keeping name
personalization. The second sentence of the previous greeting SHALL be dropped so the copy
stays a one-liner. The greeting SHALL keep its position immediately after the
"Continue learning" band, remain the only mascot on the page, and its wrapping section SHALL
use reduced vertical padding so it reads as a small friendly footer rather than a hero banner.

#### Scenario: Signed-in learner sees a compact by-name one-liner
- **WHEN** a signed-in learner with a resolved display name opens the Home landing
- **THEN** the greeting renders as a small `sm` mascot next to a single "welcome back, {name}" line
- **AND** it is not a bordered speech-bubble banner and carries no second sentence
- **AND** it sits directly below the "Continue learning" band with modest vertical padding, as the only mascot on the page

#### Scenario: Guest sees the small greeting fallback
- **WHEN** an anonymous visitor opens the Home landing
- **THEN** the same compact one-liner row renders with the guest greeting line
- **AND** it remains the single, low-padding mascot footer below the (self-hidden) courses band

### Requirement: Achievements recognition cards use the legacy Thành tựu card styling
The Home "Thành tựu" recognitions grid (`AchievementsSection`) SHALL present each of the six
real FTES recognitions as a card styled to match the legacy `Ftes-frontend` "Thành tựu" grid
(`views/home/components/achiverProject/index.tsx`): a soft accent-tinted card fill,
LEFT-aligned content, a plain accent-coloured award icon at the top of the card (no circular
icon bubble), the big highlight value (e.g. "Top 100") below the icon, then the label, with a
lift-on-hover interaction. The styling SHALL be expressed in FTES-AOS house design tokens
(no raw legacy hex) and SHALL be theme-aware in both light and dark modes. The section SHALL
keep its heading ("Achievements" / "What we've achieved") and the same six recognitions.

#### Scenario: A recognition card matches the legacy Thành tựu look
- **WHEN** the Achievements section renders a recognition (e.g. "Top 100 · Techfest Vietnam 2025")
- **THEN** the card shows a left-aligned, accent-tinted surface with a plain accent icon at the top
- **AND** the big value and its label read top-to-bottom below the icon, left-aligned
- **AND** hovering the card lifts it slightly with an accent-emphasised border/shadow

#### Scenario: Styling stays on house tokens and both themes
- **WHEN** the Achievements section is viewed in light and in dark mode
- **THEN** the card fill, icon, value and hover accents derive from house tokens (`bg-accent/5`, `text-accent`, `border-separator`/`border-accent`), not raw legacy hex
- **AND** all six recognitions and the section heading are unchanged in content
