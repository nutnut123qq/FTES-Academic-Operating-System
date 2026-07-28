# Tasks — course-review-enroll-gate

## 1. Component gate
- [x] 1.1 `CourseRatings`: add required `isEnrolled: boolean` prop (JSDoc: reuses the
      enroll CTA's `useCourseEnrollment().isEnrolled` signal; gates INPUT only).
- [x] 1.2 `StarPicker`: add `locked` + `onLockedInteract`; when `locked`, a star click
      fires `onLockedInteract` instead of `onChange`, with `aria-disabled` + not-allowed
      cursor and no selected/fill state.
- [x] 1.3 Composer textarea: when not enrolled, set `readOnly` + `aria-disabled`;
      `onMouseDown` `preventDefault` + prompt; `onFocus` `blur` + prompt (catches Tab).
- [x] 1.4 `notifyEnrollFirst` = `toast.warning(t("detail.rating.enrollFirst"))` (house
      toast pattern from `@heroui/react`, as used in `ResourceRating`).
- [x] 1.5 Leave the submit gate (`stars === 0 || isBusy`) and the server access check
      untouched.

## 2. Wire the signal
- [x] 2.1 `CourseDetail/index.tsx`: pass `isEnrolled={isEnrolled}` (already resolved via
      `useCourseEnrollment`) into `<CourseRatings>`.

## 3. i18n + verify
- [x] 3.1 Add `courseSystem.detail.rating.enrollFirst` to vi.json + en.json.
- [x] 3.2 `npx tsc --noEmit` clean.
- [x] 3.3 `npm run build` (webpack) green.
