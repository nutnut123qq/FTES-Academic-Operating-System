## 1. Fix tab strip styling and positioning

- [x] 1.1 Add opaque `bg-background` token to the community tab strip container.
- [x] 1.2 Remove the `relative` class so `sticky top-16` actually pins the strip below the site header.
- [x] 1.3 Keep existing tab functionality, dropdown, rails, grid layout, and `backdrop-blur`.

## 2. Verify

- [x] 2.1 Run `npx tsc --noEmit` with no errors.
- [x] 2.2 Run `npm run build` with no errors.
- [x] 2.3 Run `npm run dev`, open `/vi/community`, scroll ~150px, and confirm the tab strip is opaque and pinned under the site header.
