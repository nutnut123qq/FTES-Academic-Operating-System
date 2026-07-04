## 1. Update imports in `CourseDetail/index.tsx`

- [ ] 1.1 Replace `CheckIcon` with `CheckCircleIcon` in the `@phosphor-icons/react` import block. Không thêm `SealCheckIcon`.

## 2. Refactor the "What you'll learn" section

- [ ] 2.1 Guard the entire section with `course.whatYouLearn.length > 0` so it returns `null` when empty.
- [ ] 2.2 Keep the section header as `<Typography type="h6" weight="bold">{t("detail.whatYouLearn")}</Typography>` inside the existing `border-t border-separator pt-6` wrapper.
- [ ] 2.3 Render the list as `<ul className="grid grid-cols-1 gap-x-6 gap-y-3 md:grid-cols-2">`.
- [ ] 2.4 Each item is a `<li className="flex items-start gap-2">` containing:
  - `CheckCircleIcon` with `className="mt-0.5 size-5 shrink-0 text-accent"` and `aria-hidden focusable="false"`.
  - `Typography type="body-sm" color="muted"` for the text.

## 3. Update the loading skeleton

- [ ] 3.1 Replace the single `h-40` placeholder in `CourseDetailSkeleton` with a section skeleton that mirrors the new layout:
  - A `Skeleton.Typography type="h6" width="1/3"` for the section heading.
  - A 2-column grid (`grid-cols-1 md:grid-cols-2`) of placeholder rows, each row a `size-5 rounded-full` skeleton circle plus a `Skeleton.Typography type="body-sm"` bar.

## 4. Verify and test

- [ ] 4.1 Run TypeScript check (`tsc --noEmit`) and fix any errors.
- [ ] 4.2 Run production build (`npm run build`).
- [ ] 4.3 Open `/courses/mae101` and confirm the section renders as a 2-column grid on desktop, 1 column on mobile, and keeps FTES accent colors.
- [ ] 4.4 Confirm the section disappears when `whatYouLearn` is empty and the skeleton mirrors the grid layout.
