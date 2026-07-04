# profile-feature-complete — UX Brainstorm

> Step 1 of the StarCi FE loop applied to FTES Academic Operating System profile page.  
> Scope: close the §2 Academic Profile gaps left after the profile-redesign change.

## Current state (baseline)

The profile-redesign change landed a clean 2-column shell: bare identity sidebar (avatar ring, name, headline, campus, streak/rank chips, bio, edit CTA) + underline tab bar + section content.  
Tabs: Personal, Academic, Portfolio, Community, Progress.

## §2 gaps to close

| Section | §2 requirement | Current state |
|---|---|---|
| Personal | Cover image | Missing |
| Personal | Avatar image (not just initials) | Only `AvatarFallback` |
| Personal | Contact block (email/phone) | Only email via socials |
| Portfolio | Resume / CV view+download | Missing entirely |
| Portfolio | Certificates list | Missing |
| Portfolio | Achievements / badges wall | Only gamification badges in Progress |
| Community | Followers / Following counts + list | Missing |
| Community | Activity Timeline | Only "recent posts" |
| Progress | FTES Coin display | Missing (only in `/wallet`) |
| Progress | Reputation display | Only in Community tab |

## Reference patterns to steal (from `starci-academy` PublicProfile)

1. **Identity column = hero, not card.** Cover on top of the sidebar, overlapping avatar, name block, follower links, badge medals, share CTA.
2. **Followers/Following** as inline text links under the name, opening a follow-list modal.
3. **Achievements** as grouped badge walls (Learning / Skills / Community / Course / Other) with mascot tiles + name + rank/rarity.
4. **Activity timeline** as a vertical feed with day grouping, kind icon badge, sentence, relative time.
5. **Contributions heatmap** as GitHub-style weekly grid with year switcher + streak line.
6. **Pinned / Capstone projects** as 2-column grid of bordered project cards or a surface list.

## Proposed layout direction (recommended)

### Direction A — "Hero + cards" (chosen)

Keep the existing 2-column shell, but **upgrade the left sidebar into a true hero column** and **add the missing cards on the right tabs**. No architecture change, minimal risk.

#### Personal (left sidebar + Personal tab)

- **Cover banner**: `ProfileShell` sidebar gets a top cover image (`rounded-2xl`, `h-32`, object-cover) spanning the sidebar width. Mock `coverUrl` in `useQueryProfileSwr`.
- **Avatar with image**: `Avatar` uses `AvatarImage` when `avatarUrl` exists; gradient ring stays as fallback frame. Mock `avatarUrl`.
- **Contact card** inside `ProfilePersonal`: separate `LabeledCard` "Contact" with rows for email, phone, address, each with Phosphor icon + value. Mock `contact` object in `useQueryProfilePersonalSwr`. Keep existing social links card.

#### Portfolio tab

Three new `LabeledCard` sections, plus a polished project grid.

- **Resume / CV**: new `ProfileCV` block (or inline section) showing a document card with filename, upload date, "View / Download" buttons. Mock `resume` object in `useQueryMyPortfolioSwr`.
- **Certificates**: list/card grid of certificates (`name · issuer · date · link`). Mock `certificates` array.
- **Achievements**: a badge wall, borrowing the starci grouped-grid pattern. Mock `achievements` array with `title`, `description`, `icon`, `earnedDate`, `category`.
- **Projects**: keep existing CRUD but wrap each project in a `rounded-2xl` bordered card; optionally add a "pinned" flag to the mock data and render pinned projects first in a 2-column grid (steal `ProfilePinned` layout).

#### Community tab

- **Followers / Following**: new inline metric row or metric cards with counts; tapping opens a follow-list modal (or just links). For FE-only, mock counts + a modal/drawer rendering a short list.
- **Activity Timeline**: reuse the existing `ActivityTimeline` component (or a profile-flavored inline version) inside a `LabeledCard`, fed by `useQueryActivitySwr`.
- **Recent posts**: keep existing card.
- **Reputation**: move the reputation tile section to **Progress** tab per spec.

#### Progress tab

- Add a top **gamification wallet row**: FTES Coin card + Reputation card (2-column `MetricCard` grid).
- Keep XP/level, rank/league, streak heatmap, badges, skill graph.
- Heatmap stays 12-week streak calendar; later can upgrade to a contributions-style multi-level heatmap.

### Direction B — "Overview-first dashboard" (rejected)

Replace the current 5 tab sections with a single long dashboard in the right column (hero identity + overview cards + recent activity). Rejected because it breaks the existing tab navigation and route model, and the user explicitly asked to keep the 5 tabs.

### Direction C — "Full public profile clone" (rejected)

Port the starci public profile layout directly (tabs in navbar, left hero, right tab content). Rejected because FTES already has a working tab bar and route structure; cloning starci would require re-architecting the navbar bottom layer.

## Widget mockups

### Hero sidebar widget

```
┌─────────────────────────────┐
│  [cover image rounded-2xl]  │
│                             │
│    ╭──────╮                 │
│    │ AVATAR  (ring)         │
│    ╰──────╯                 │
│        Name                 │
│     @headline               │
│   [campus chip]             │
│  [streak] [rank]            │
│  42 followers · 18 following│
│        bio                  │
│  [    Edit profile    ]     │
└─────────────────────────────┘
```

### Portfolio tab widget

```
[Resume] ──────────────── [View] [Download]
┌─────────────────────────────────────────┐
│ [file icon]  CV_NguyenVanHoc.pdf        │
│              Updated 2026-06-20         │
└─────────────────────────────────────────┘

[Projects] ──────────────── [Add project]
┌─────────────┐ ┌─────────────┐
│ Title       │ │ Title       │
│ desc        │ │ desc        │
│ [tag][tag]  │ │ [tag]       │
│ View →      │ │ View →      │
└─────────────┘ └─────────────┘

[Certificates]
┌─────────────────────────────────────────┐
│ [trophy] AWS Cloud Practitioner · Amazon│
│          2024-03-15 · [link]            │
└─────────────────────────────────────────┘

[Achievements]
[🏅][🏅][🏅][🏅][🏅][🏅]  +3
```

### Community tab widget

```
[Followers]  [Following]  [Reputation]
    42           18           187

[Activity timeline]
●──── lessonCompleted — Bài 3: Con trỏ...        2h
●──── questionPosted — Tại sao segmentation...   4h
●──── badgeEarned — Streak 7 days               1d

[Recent posts]
```

### Progress tab widget

```
[FTES Coin]              [Reputation]
   2,450                    187
   View wallet →

[XP/level card]          [Rank/league]

[Learning activity calendar]
[heatmap grid]

[Badges]

[Skill graph]
```

## Visual system notes

- Use FTES tokens (`--accent`, `bg-default`, `text-muted`, `border-separator`), not starci teal directly.
- Spacing: `gap-6` between cards/sections, `gap-3` inside cards, `gap-2` for icon+text rows.
- Radius: `rounded-2xl` for bordered panels, `rounded-full` for avatar/pills.
- Icons: Phosphor (`*Icon`) for UI; `react-icons/fa6` for brand logos.
- Data regions: always `AsyncContent` + skeleton mirroring layout + `EmptyContent`.

## Backend assumption (documented for drop-in swap)

Every new field is mocked inside the existing SWR hook files with a clear `// ponytail: mock BE` comment and a typed interface extension. No real API is called. The mock shape documents the expected future contract.

## Decision

Proceed with **Direction A**.
