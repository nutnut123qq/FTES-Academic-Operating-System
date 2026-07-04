## 1. Preparation

- [x] 1.1 Locate the subject workspace header component (`src/components/features/subject/SubjectWorkspaceShell/index.tsx`) and confirm how `subject.progress` and `subject.lecturer` are rendered.
- [x] 1.2 Verify existing reusable progress component (`src/components/blocks/stats/ProgressMeter/index.tsx`) and design tokens (`accent`, `muted`, `separator`).

## 2. Implement Header Changes

- [x] 2.1 Replace the progress text in `SubjectWorkspaceShell` subtitle with `ProgressMeter` using `value={subject.progress}`, size `sm`, color `accent`, and no label/showValue.
- [x] 2.2 Ensure the progress bar exposes accessibility attributes `role="progressbar"`, `aria-valuenow`, `aria-valuemin="0"`, `aria-valuemax="100"` (via HeroUI `ProgressBar`) and a meaningful `aria-label` ("Tiến độ hoàn thành" / "Completion progress").
- [x] 2.3 Remove the lecturer/student name `Chip` from the header row.
- [x] 2.4 Remove unused `Chip` import if it is no longer referenced in the file.
- [x] 2.5 Remove dead i18n key `subjects.progress` from `messages/vi.json` and `messages/en.json`; add `subjects.progressLabel` for the progress bar `aria-label`.

## 3. Verify

- [x] 3.1 Run `npx tsc --noEmit` and confirm no new type errors in the modified file (pre-existing errors in other files are unrelated).
- [x] 3.2 Run `npm run lint` / `npx eslint` on the modified file and fix lint errors.
- [x] 3.3 Do a visual/manual check that the header shows the progress bar (full width, value from `subject.progress`) and no lecturer chip.

## 4. Skill Review & Archive

- [x] 4.1 Run correctness review on the diff.
- [x] 4.2 Run minimalism / anti-over-engineering review on the diff.
- [x] 4.3 Address any findings from the reviews.
- [x] 4.4 Run `npx openspec validate --strict` and `npx openspec archive subject-workspace-header-progress`.
