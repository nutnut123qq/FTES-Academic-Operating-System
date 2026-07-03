## 1. Layout foundation

- [x] 1.1 Redesign `ProfileShell`: bare identity sidebar + gradient ring avatar + `ExtendedTabs` tab bar.
- [x] 1.2 Add `ProfileShellSkeleton` and wire it through `AsyncContent` for identity + gamification.
- [x] 1.3 Add/update i18n keys for tab labels, identity meta, empty states.

## 2. Tab content redesign

- [x] 2.1 Redesign `ProfilePersonal` with `LabeledCard` (About + Social links) and brand icons + hover state.
- [x] 2.2 Add `PersonalSkeleton` mirroring the new layout.
- [x] 2.3 Redesign `ProfileAcademic` as metric tiles inside a `LabeledCard`.
- [x] 2.4 Add `AcademicSkeleton` mirroring the new layout.
- [x] 2.5 Redesign `ProfileCommunity` with `MetricCard` reputation grid + `LabeledCard` recent posts + `EmptyContent`.
- [x] 2.6 Update `CommunitySkeleton` to match the new layout.
- [x] 2.7 Wrap `ProfilePortfolio` sections in `LabeledCard` and improve empty state.
- [x] 2.8 Redesign `ProfileProgress` with `LabeledCard` sections and move `SkillGraph` into `AsyncContent`.
- [x] 2.9 Update `ProgressSkeleton` to match the new layout.

## 3. Layout, UX, skeleton, and canon passes

- [x] 3.1 Run `starci-fe-layout-apply` to fix spacing/scale violations.
- [x] 3.2 Run `starci-fe-skeleton-apply` to verify every fetch has a skeleton/empty/error state.
- [x] 3.3 Run `starci-fe-cannon-audit` and fix violations.
- [x] 3.4 Run `starci-fe-cannon-apply` for any new code.

## 4. Verification & close-out

- [x] 4.1 Run `tsc --noEmit` and fix type errors.
- [x] 4.2 Run `eslint` on touched files and fix warnings/errors.
- [x] 4.3 Update decision journals (`decision/*.md`) and design journal (`design/profile.md`) per `starci-fe-ux-apply`.
- [x] 4.4 Apply the change with `openspec-apply-change` and mark tasks complete.
- [x] 4.5 Archive the change with `openspec-archive-change`.
