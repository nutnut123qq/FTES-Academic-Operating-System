# home-landing — Delta

## MODIFIED Requirements

### Requirement: Bảng vàng FTES honor section
The landing SHALL include a "Bảng vàng FTES" section honoring real FTES achievers —
at minimum Kim Khoa (TOP 100 sinh viên xuất sắc 3 kỳ liên tiếp, GPA 9.35 – 9.42 –
9.1, Học Bá kì FA25), Hoàng Blue (GPA 9.4, danh hiệu Học Tốt + Học bổng Tài Năng),
Hoàng Duy (Top 100 FPTU TP.HCM, GPA 9.6), Hồng Phúc, Phan Chi Thông, Trần Việt —
and SHALL link to the full leaderboard at `/leaderboard`. Presentation SHALL be
tiered: featured achievers render as large podium cards (center card visually
elevated on desktop), remaining achievers as compact cards below. Each achiever's
name and achievement lines SHALL be DOM text (name rendered with a metallic
gradient text treatment built from the theme `accent` token — never baked into an
image); each card shows the portrait, the name, one highlight metric as the
dominant element, and the achievement lines. The section's highlight color SHALL
be the theme `accent` token used as an accent only (name, metric, ring, glow) on
translucent glass cards over a subtle ambient section background, matching the
site's primary color scheme in both light and dark themes — not a standalone
gold/warning palette.

#### Scenario: Honored learners render
- **WHEN** the honor section renders
- **THEN** the achievers appear with image (alt text = name), name, and achievement text
- **AND** a link/CTA navigates to `/leaderboard` (locale-aware navigation)

#### Scenario: Section matches the theme accent
- **WHEN** the honor section renders
- **THEN** its highlight elements (name gradient, metric, portrait ring, chip, hover
  glow, ambient orbs) derive from the theme `accent` token, with no `warning`/gold
  styling remaining

#### Scenario: Tiered podium layout
- **WHEN** the honor section renders on desktop
- **THEN** featured achievers appear as large podium cards ordered 2-1-3 with the
  center card elevated, and the remaining achievers as compact cards below

#### Scenario: Highlight metric animates once
- **WHEN** a podium card enters the viewport
- **THEN** the numeric part of its highlight counts up once to its final value
- **AND** with `prefers-reduced-motion` the final value renders immediately

#### Scenario: Missing achiever image falls back
- **WHEN** an achiever's image fails to load or is absent
- **THEN** an initials placeholder renders in its place without breaking the card layout

#### Scenario: Empty honor list hides the section
- **GIVEN** the achievers list is empty
- **WHEN** the landing renders
- **THEN** the honor section is not rendered
