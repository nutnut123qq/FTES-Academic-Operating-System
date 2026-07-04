## 1. Edit profile page

- [x] 1.1 Add `/profile/edit/page.tsx` rendering `useEditProfileForm` (Controller-wired fields + avatar picker + Save).
- [x] 1.2 Reuse existing `profileEdit.*` + `publicProfile.workMode.*` i18n (no new keys).

## 2. Progress decouple

- [x] 2.1 Move the FTES Coin + Reputation `MetricCard` row out of the gamification `AsyncContent` in `ProfileProgress` so it renders from its own hooks.

## 3. Verify

- [x] 3.1 `tsc --noEmit` clean.
- [x] 3.2 `eslint` clean on touched files.
- [x] 3.3 Preview: Coin/Reputation render while gamification is empty; edit form renders and fields are interactive.
