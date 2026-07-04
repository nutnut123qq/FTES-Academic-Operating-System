## 1. Code change

- [x] 1.1 Update `src/components/features/community/CommunityShell/index.tsx`: remove `bg-background` and add `backdrop-blur` to the sticky header div.
- [x] 1.2 Update the inline comment above the header to describe the transparent + blur intent (meteors pass through, no fill, no border).

## 2. Verify

- [x] 2.1 Run `npx tsc --noEmit` and ensure no errors.
- [x] 2.2 Run `npx eslint` on the touched file and ensure no errors.
- [x] 2.3 Run `npm run build` (Webpack production) and ensure exit 0.
- [x] 2.4 Run `npm run dev`, open `/vi/community` at ≥1280px, and visually confirm meteors pass through the header in both light and dark modes; tabs stay centered and sticky; `⋯` menu stays absolute right below `xl`.

## 3. Finalize

- [x] 3.1 Archive the OpenSpec change with `npx openspec archive community-header-blur --yes`.
- [x] 3.2 Append the decision to `.claude/decision/tabs.md`: Community header = pure `backdrop-blur`, no background fill, no border, so it blends into the ambient meteor background.
