## Why

The `render-community-comment-sticker` change left a temporary verification script (`scripts/verify-sticker-render.tsx`) in the repo. It is no longer needed and should be removed to keep the workspace clean. The sticker mock comment in `useQueryPostDetailSwr` should be kept as a runtime demo but explicitly marked so future maintainers know it is intentional.

## What Changes

- Delete `scripts/verify-sticker-render.tsx` after confirming nothing imports it.
- Add a short comment marker next to the `pc3` mock comment in `useQueryPostDetailSwr.ts`.

## Capabilities

### New Capabilities
<!-- None -->

### Modified Capabilities
<!-- None — this is a repo hygiene chore. -->

## Impact

- **Affected files**: `scripts/verify-sticker-render.tsx`, `src/components/features/community/hooks/useQueryPostDetailSwr.ts`.
- **Backend/API**: None.
- **Behavior**: No user-facing or runtime behavior changes.
