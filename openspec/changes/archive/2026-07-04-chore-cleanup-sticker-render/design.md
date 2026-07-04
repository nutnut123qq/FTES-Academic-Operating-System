## Context

After verifying the sticker render path, the temporary verification script should not remain in the repository. The mock comment used for verification is useful as a visual demo until the backend is wired, so it stays but is clearly labeled.

## Goals / Non-Goals

**Goals:**
- Remove dead verification code.
- Mark the intentional sticker mock comment.

**Non-Goals:**
- Changing any render or composer logic.
- Removing the mock comment.

## Decisions

- **Keep the mock comment**: It serves as an end-to-end demo for the sticker render feature until real backend data arrives.
- **Add an inline comment**: A short `// demo: sticker render` marker makes the intent explicit.

## Risks / Trade-offs

- **Mock data persists in production build** → Acceptable because the entire `useQueryPostDetailSwr` is a temporary mock layer documented as "ponytail: mock BE".

## Migration Plan

1. Search the repo for imports of the verify script.
2. Delete the script if no imports exist.
3. Add the comment marker.
4. Run `tsc --noEmit` and `npm run build` to confirm no orphaned references.
