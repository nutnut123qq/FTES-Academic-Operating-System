# design/ — page-level UX: layout, flow + UX patterns (fetched live from the web)

What lives here:
1. **Per-page UX decisions** — the layout/flow we settled on for a page, and why.
2. **Layout foundations** — the page recipe + the 3-tier law (how a page is composed).
3. **UX pattern lessons** — what the best course websites do, **fetched LIVE from the web** during
   brainstorm; the durable takeaways accumulate here. No static teardowns.

Siblings: `../ui/CONTENT.md` (the visual system — tokens/typography/spacing), `../decision/<block>.md`
(per-block decision logs), `../../cannon/CONTENT.md` (code rules).

## Layout foundations (page recipe + 3-tier law — from the design system)
To build a page that looks native: (1) pick the nearest **archetype** (Course detail / Course learn /
Challenge split); (2) reuse the frame — `max-w-[1280px]` container, `grid md:grid-cols-5` (3/2) or
`grid-cols-4` (sidebar), breadcrumbs on top; (3) build with **HeroUI v3**, no hand-rolled primitives;
(4) semantic tokens only (`bg-default/40`, `text-muted`, `color="accent"`) — good in both themes;
(5) reuse patterns (count/meta-chip `Chip size="sm" variant="soft" color="accent"` + Phosphor icon; outline
rail active = `text-accent bg-accent/10`; price VND primary + USD `text-muted` secondary; `MarkdownContent` +
Shiki); (6) i18n every string (next-intl); (7) data via GraphQL `query-*`/`mutation-*` + SWR hook.
**Don't:** hardcode hex, hand-roll button/modal/accordion, hardcode copy, px-locked layout, or forget dark.

**Content-column "parts" layout (law — 2026-06-21, supersedes the old `h-3`-between-tiers rule):**
Every content page = Breadcrumb → Header (`Heading level={3}` H3 + `body-sm muted` desc) → Content, but the
column is built as **stacked PARTS**, and:
- **Every part has its own `max-w` cap + `p-6` inner padding** (all parts share the same cap so they align left).
- **Separation between parts:** a `border`/`Divider` between two parts → each part stays `p-6` (the line
  separates). **No divider → use the GAP** (`gap-3` for related content, `gap-6` for two different content
  sections — see `../ui/gap.md`), not extra padding.
- Within a part, `gap-3`. Title↔description is `gap-0`. **`gap-8` is reserved for whole LAYOUT regions**
  (e.g. the two profile/dashboard columns), never between vertical content parts.

(Old rule was `h-3` spacers between tiers — replaced by the `p-6`/`p-8` part model above.) Personal
home/profile + dashboard use the **2-column shell** (identity/sections left+right) with **`gap-8`** between the
two sides — NOT a 3-rail layout.

**Shared shell padding = gate it to the layout mode (2026-06-21).** A shell that serves several page modes
(e.g. `LearnShell` → lesson-reader / personal-project / foundations) must apply mode-specific padding
**conditionally on that mode**, never on the shared content slot for all modes. The lesson-reader's region rule
(`p-6 pr-0 pb-0` for its gap-8 4-column layout) leaked to every learn tab: sibling pages bring their OWN page
padding (`p-3`), so the unconditional shell `p-6` **stacked** into `p-6 + p-3` = a doubled top gap, and the
`pr-0`/`pb-0` jammed their content against the edge/border. Fix: `cn("flex-1", isLessonReader && "p-6 lg:pr-0
lg:pb-0", …)`. **Rule: padding that exists for ONE layout mode is conditional on that mode** (see also
`../ui/padding.md` "don't stack padding").

## Per-page decisions
`<page>.md` (e.g. `lesson-reader.md`, `dashboard.md`) — the archetype chosen, the section order, the flow,
and **why**. Added/updated automatically at the end of `/starci-fe-ux-apply`.

## UX pattern lessons (from the web)
During brainstorm: **read this section first**, then `WebSearch`/`WebFetch` only what's missing, and append
the new lesson here at the end of the task.

### Which platforms to fetch, by page type
| Page type | Fetch |
|---|---|
| Catalog / discovery / cards | Coursera, Udemy, Skillshare |
| Lesson reader / player / code editor | Codecademy, Udemy, Khan Academy, Frontend Masters |
| Gamification (XP/streak/league/badge) | Duolingo, Brilliant, Khan Academy |
| Onboarding / activation | Duolingo, Codecademy |
| Pricing / paywall / upgrade | Coursera, Brilliant, Duolingo |
| Dashboard / home / mobile | Codecademy, Coursera |
| Trust / certificate / serious-dev tone | edX, Frontend Masters, freeCodeCamp |

### Accumulated lessons
- **Browse-by-category catalog = hero → chip bar → facet+sort → per-category shelves**
  · Coursera/Udemy do it well · takeaway for the house: below a featured hero, render one
  horizontal scroll-snap shelf per non-empty category (header = icon + name + "Xem tất cả"
  → category landing page), a chip bar for quick category narrowing, and a facet bar
  (search + level + sort) that flips the shelves into a flat grid when active — search must
  span ALL categories · what NOT to copy: autoplaying shelves (only the hero autoplays;
  shelves are manual swipe only) and Udemy's aggressive badge noise (max ONE badge per
  card) · source: coursera.org/browse, udemy.com/topic pages · 2026-07-02
- **Social feed = Threads restraint, not card grids** · Threads (threads.com, token
  `--barcelona-*` đọc trực tiếp 2026-07-03) làm feed tĩnh lặng bằng: 1 cột ~572–620px,
  hairline divider THAY card/shadow, post = grid `48px + content` (avatar 36px, name+time
  1 hàng), hàng action đơn sắc với count ẨN khi 0, màu bão hoà duy nhất = tim đỏ khi liked,
  composer = trigger inline "What's new?" → modal, threadline nối avatar↓replies · takeaway
  cho nhà: map sang semantic token (separator/muted/danger), giữ underline tabs thay
  dropdown khi scope cần discoverability · what NOT to copy: hex cứng #101010 (phá light
  mode + token nhà), left icon-rail 76px (đã có navbar), auto-update stream (chưa có BE)
  · source: threads.com HTML tokens, ishadeed.com/article/threads-app-css (Part 1+2), Meta
  newsroom 2025-04 · 2026-07-03
- **Sticky enroll "buy box" on a course detail page** · Coursera/Udemy do it well · takeaway
  for StarCi: on a course *sales* page, keep price + CTA + "what's included" in a sticky right
  rail (`col-span-2`) while the pitch (hero, what-you'll-learn, syllabus, reviews, instructor)
  scrolls on the left (`col-span-3`) — the learner decides without losing the CTA · what NOT to
  copy: their branding/content, the aggressive countdown-timer urgency; keep CTA = enroll, not
  buy/VIP · source: coursera.org course pages, udemy course landing · 2026-07-02
- **Honor board / hall of fame: gold is an ACCENT, hierarchy is the design** · takeaway
  for the house: (1) the less gold, the more premium — near-black bg, gold only on
  name/metric/ring/thin borders, never flooding backgrounds/decor; (2) 1 card = 1 focal
  point: portrait treated uniformly + name as REAL text + ONE dominant metric, details
  small and muted; (3) tier the honorees (podium row bigger than the grid) — equal cards
  read as a list, tiers read as an honor; (4) never bake names/decor into images — every
  poster ships its own typography and kills responsiveness/crawlability; (5) prefer subtle
  micro-interaction (hover glow, one-shot count-up) over static confetti/laurel clutter
  · what NOT to copy: school touchscreen-kiosk font-size guidance (that's 10-ft viewing,
  not web) · sources: joekotlan.com (gold on web), halloffamewall.com UX guide,
  digitalwalloffame.com layouts, speckyboy.com metallic CSS · 2026-07-03
