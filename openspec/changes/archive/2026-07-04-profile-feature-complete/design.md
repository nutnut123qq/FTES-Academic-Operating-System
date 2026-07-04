## Context

The FTES Academic Operating System profile page (`src/components/features/profile`) was recently redesigned into a 2-column shell with 5 tabs. The redesign improved visual hierarchy but did not fully implement §2 Academic Profile from `../FTES Admin/ftes.txt`. This change closes the remaining gaps while staying FE-only and reusing the existing block system.

## Goals / Non-Goals

**Goals:**
- Add cover image and avatar image rendering to the identity sidebar.
- Add a structured Contact card in the Personal tab.
- Add Resume/CV, Certificates, and Achievements to the Portfolio tab.
- Add Followers/Following counts+list and Activity Timeline to the Community tab.
- Add FTES Coin and Reputation display to the Progress tab.
- Keep all new data mocked inside existing/new SWR hooks with documented future contracts.
- Ensure every data-backed region has skeleton, empty, and error states via `AsyncContent`.
- Localize every new string in `vi.json` and `en.json`.

**Non-Goals:**
- No backend implementation or real API integration.
- No file upload functionality (resume/avatar/cover are mocked URLs only).
- No follow/unfollow actions (read-only counts and lists).
- No public-profile redesign (only the owner profile tabs are in scope).

## Decisions

1. **Extend existing hooks rather than create new top-level ones.** Each tab already owns a hook (`useQueryProfileSwr`, `useQueryProfilePersonalSwr`, `useQueryMyPortfolioSwr`, `useQueryMyCommunitySummarySwr`, `useQueryMyGamificationSwr`). New fields are added to these interfaces and mocks, so the component→hook relationship stays the same and the BE swap is localized.
2. **Resume/CV lives in Portfolio, not a new tab.** The spec puts Resume under Portfolio, and the user explicitly said to wire it into the Portfolio tab using a `CV/` component. Since no `CV/` directory exists, a lightweight `ProfileResumeCard` block will be added inline inside `ProfilePortfolio`.
3. **Achievements are rendered in Portfolio as the "wall" view.** The spec lists Achievements under Portfolio; gamification badges already live in Progress. The new Portfolio achievements are distinct academic/community trophies.
4. **Followers/Following use a simple inline list in a `LabeledCard`, not a full overlay store.** To avoid adding new Zustand overlay complexity, the counts are shown as metric cards; a "View list" button expands a compact list inside the same card.
5. **Activity Timeline reuses the existing `ActivityTimeline` feature.** A thin `ProfileActivity` wrapper embeds it inside a `LabeledCard` so it inherits profile skeleton/empty styling.
6. **FTES Coin and Reputation are top-level metric cards in Progress.** They use `useQueryWalletSwr` and the reputation data already present in `useQueryMyCommunitySummarySwr`.
7. **Cover image is placed inside the bare identity sidebar, not above the whole page.** This keeps the existing 2-column responsive behavior and avoids reworking the page grid.

## Risks / Trade-offs

- **[Risk]** Mock shapes may diverge from the eventual backend contract.  
  **Mitigation:** Each mock interface is explicitly typed and commented with `// ponytail: mock BE` so the contract is discoverable.
- **[Risk]** Adding many cards to Portfolio/Community makes the tab very long.  
  **Mitigation:** Cards are collapsible/scrollable only where needed; empty sections self-hide; layout uses `gap-6` so the rhythm stays breathable.
- **[Risk]** Reputation currently lives in Community and is being referenced in Progress too.  
  **Mitigation:** Reputation remains in the Community hook but is also displayed in Progress; no data duplication, only a second read.
