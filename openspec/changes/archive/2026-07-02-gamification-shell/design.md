## Layout — progression dashboard

A single `mx-auto max-w-6xl p-6` client column (mirrors `SubjectCatalog`), title +
subtitle, then three stacked sections:

- **Stat cards** — a `grid-cols-2 lg:grid-cols-4` row of metric cards
  (`rounded-large bg-default/40 p-4`), one each for XP · Level · Streak · Rank.
  Each card = a muted icon+label header (phosphor `LightningIcon` · `StarIcon` ·
  `FireIcon` · `RankingIcon`) over the value. Values are rounded and
  locale-formatted (`Math.round(v).toLocaleString()`).
- **Leaderboard list** — a `TrophyIcon` section header over ranked rows. Each row =
  house link-card class `rounded-large border border-separator p-3` with rank number,
  an initials avatar tile (`bg-accent/10 text-accent`), name + level, and XP. The
  current user's row (`entry.id === CURRENT_USER_ID`) gets `bg-accent/10` +
  `color="accent"` rank.
- **Badges row** — a `StarIcon` section header over `flex-wrap` badge tiles
  (`rounded-large bg-default/40 p-4`). Earned = `TrophyIcon weight="fill" text-accent`;
  locked = `opacity-50` + muted icon + a `badgeLocked` chip.

## Data
`useQueryLeaderboardSwr` — mock, SWR-shaped (`useSWR(["leaderboard"], …)`). Returns
`me` `{ xp, level, streak, rank }`, `board` (~8 `{ id, name, xp, level, avatarInitials }`),
and `badges` (~5 `{ id, name, earned }`). `me` mirrors the `board` row whose id is
`CURRENT_USER_ID` ("me") so the shell can highlight the current user without a join.
`ponytail:` note marks the BE swap point.

## a11y / theming
- Tokens only (`bg-default/40`, `bg-accent/10`, `text-accent`, `text-muted`,
  `border-separator`) → dark-mode safe.
- Displayed numbers rounded; XP locale-formatted.
- Icons are decorative next to text labels (label carries the meaning).

## Not doing
- No nav/path-builder wiring (shared files untouched) — add when the domain is linked
  into the chrome.
- No real ranking/season/BE; no pagination (8 mock rows).
