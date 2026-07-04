## 1. Cleanup

- [x] 1.1 Search the repo for any import/reference to `verify-sticker-render`.
- [x] 1.2 Delete `scripts/verify-sticker-render.tsx`.

## 2. Mark mock demo

- [x] 2.1 Add `// demo: sticker render` next to the `pc3` mock comment in `src/components/features/community/hooks/useQueryPostDetailSwr.ts`.

## 3. Verify

- [x] 3.1 Run `npx tsc --noEmit` and confirm no errors.
- [x] 3.2 Run `npm run build` (webpack) and confirm success.
- [x] 3.3 Run `npm run lint` on touched files and confirm no errors.

## 4. Archive

- [x] 4.1 Run `openspec-archive-change` for `chore-cleanup-sticker-render`.
