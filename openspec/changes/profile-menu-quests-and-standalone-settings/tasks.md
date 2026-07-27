## 1. Quests → account popup

- [x] 1.1 `features/app-shell/useAppNav.tsx` → remove the `makeModule("quests", …)` entry and the now-unused `TargetIcon` import.
- [x] 1.2 `features/navbar/Navbar/AccountMenuDropdown/AccountMenuAuthed/index.tsx` → add a "Nhiệm vụ" `Dropdown.Item` (id `quests`, `TargetIcon`, `t("nav.quests")`, `go(pathConfig().locale().quests().build())`) after the "saved" item.

## 2. Settings standalone

- [x] 2.1 `app/[locale]/profile/layout.tsx` → make it a client layout; when `useSelectedLayoutSegment() === "settings"` render children in a plain centered container, else `ProfileShell`.

## 3. Verify

- [x] 3.1 `tsc --noEmit` clean.
- [x] 3.2 `next build --webpack` green (Compiled successfully, 4.7min).
- [x] 3.3 Quests no longer in header; appears in account popup and routes to `/quests`. Settings page renders without the profile identity/tabs frame; other profile sections unchanged.
