## 1. Data model + mock

- [x] 1.1 Expand `CourseInstructor` interface in `useQueryCourseDetailSwr.ts` with `avatarUrl`, `role`, `stats`, `achievements`, and `links`.
- [x] 1.2 Fill the mock instructor object for "Lê Minh Quân" with plausible values.

## 2. i18n keys

- [x] 2.1 Add new `courseSystem.detail.instructor.*` keys to `src/messages/vi.json`.
- [x] 2.2 Add matching English keys to `src/messages/en.json`.

## 3. UI implementation

- [x] 3.1 Replace the minimal instructor block in `CourseDetail/index.tsx` with a full instructor card using `UserAvatar`, `StatRibbon`, `FollowButton`, HeroUI `Link`, and `Typography`.
- [x] 3.2 Ensure spacing uses only the `0/2/3/4/6` scale and icons carry `aria-hidden` + `focusable="false"`.

## 4. Verify

- [x] 4.1 Run `tsc --noEmit` and fix any type errors.
- [x] 4.2 Run `npm run build` (webpack) and ensure it passes.
