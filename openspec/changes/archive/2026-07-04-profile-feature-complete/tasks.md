## 1. Personal phase

- [x] 1.1 Extend `useQueryProfileSwr` mock: add `avatarUrl` and `coverUrl` to `Profile` interface and sample data.
- [x] 1.2 Update `ProfileShell` sidebar: render cover image, `AvatarImage` with fallback initials, and adjust skeleton.
- [x] 1.3 Extend `useQueryProfilePersonalSwr` mock: add typed `contact` object (email/phone/address).
- [x] 1.4 Update `ProfilePersonal`: add Contact `LabeledCard` with icon rows, empty state, and skeleton update.
- [x] 1.5 Add i18n keys for cover/avatar alt text and contact labels in `vi.json`/`en.json`.

## 2. Portfolio phase

- [x] 2.1 Extend `useQueryMyPortfolioSwr` mock: add `resume`, `certificates`, and `achievements` typed shapes.
- [x] 2.2 Build `ProfileResumeCard` block/view inside `ProfilePortfolio`: document metadata + view/download buttons.
- [x] 2.3 Build `ProfileCertificates` list inside `ProfilePortfolio`: card rows with name/issuer/date/link.
- [x] 2.4 Build `ProfileAchievements` wall inside `ProfilePortfolio`: grouped badge grid with icon/name/date.
- [x] 2.5 Polish project grid: 2-column responsive cards, pinned projects first, update `PortfolioSkeleton`.
- [x] 2.6 Add Portfolio i18n keys in `vi.json`/`en.json`.

## 3. Community phase

- [x] 3.1 Extend `useQueryMyCommunitySummarySwr` mock: add `followers`, `following` arrays and counts.
- [x] 3.2 Build Followers/Following section in `ProfileCommunity`: metric cards + expandable compact list.
- [x] 3.3 Embed Activity Timeline in `ProfileCommunity` via a new `ProfileActivity` wrapper + `LabeledCard`.
- [x] 3.4 Update `CommunitySkeleton` to include followers and activity rows.
- [x] 3.5 Add Community i18n keys in `vi.json`/`en.json`.

## 4. Progress phase

- [x] 4.1 Wire `useQueryWalletSwr` into `ProfileProgress` and add FTES Coin metric card.
- [x] 4.2 Wire reputation from `useQueryMyCommunitySummarySwr` into `ProfileProgress` as Reputation metric card.
- [x] 4.3 Update `ProgressSkeleton` to include the wallet/reputation row.
- [x] 4.4 Add Progress i18n keys for wallet/reputation in `vi.json`/`en.json`.

## 5. Polish & verification

- [x] 5.1 Apply `starci-fe-layout-apply` spacing rules across touched files.
- [x] 5.2 Apply `starci-fe-skeleton-apply` to ensure every data region has skeleton/empty/error states.
- [x] 5.3 Run `starci-fe-cannon-audit` on touched files and fix violations.
- [x] 5.4 Run `npx tsc --noEmit` and fix type errors.
- [x] 5.5 Run `npx eslint` on touched files and fix lint errors.
- [x] 5.6 Mark tasks complete and archive the OpenSpec change.
