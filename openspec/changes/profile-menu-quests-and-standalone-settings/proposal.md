## Why

Two navigation placements read wrong to the user:

- **Quests ("Nhiệm vụ") sat as a top-level header module** next to Home/Workplace/Course/Community/Blog. A daily quest board is a *personal* surface, not a primary section of the app — it belongs in the account (avatar) popup with the other personal destinations, not in the primary nav.
- **Settings was rendered inside the profile shell.** `/profile/settings` sat under the profile identity header + section tabs, as if Settings were just another profile section. Account settings is its own standalone page, not a facet of the public-facing profile.

## What Changes

- Remove the `quests` module from the primary header/mobile nav (`useAppNav`), and add a "Nhiệm vụ" item to the signed-in account popup (`AccountMenuAuthed`), after "Đã lưu", pointing at the same `/quests` route.
- The `/profile` layout renders the **Settings** subtree (`/profile/settings/*`) standalone — a plain centered container — instead of wrapping it in `ProfileShell`. All other profile segments keep the shell.

No route changes (Quests stays `/quests`, Settings stays `/profile/settings/*`), no backend, no new dependency.

## Capabilities

### New Capabilities
- `account-navigation`: where personal destinations (quests) live relative to the primary nav, and how the account Settings page is framed relative to the profile shell.

## Impact

- `src/components/features/app-shell/useAppNav.tsx` — drop the `quests` module (and its now-unused `TargetIcon` import).
- `src/components/features/navbar/Navbar/AccountMenuDropdown/AccountMenuAuthed/index.tsx` — add the "Nhiệm vụ" item (`TargetIcon`, `nav.quests`, `→ /quests`).
- `src/app/[locale]/profile/layout.tsx` — client layout; render `settings` segment standalone, else `ProfileShell`.
- No backend, no new dependency, no i18n keys added (reuses `nav.quests`).
