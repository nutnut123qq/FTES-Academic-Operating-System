## Context

The course detail page (`/courses/[courseId]`) is a sales-style layout with a scrolling left column and a sticky right enroll card. The instructor section at the bottom of the left column is currently the weakest part of the page: it renders only the instructor name, title, and a one-sentence bio. The FTES AOS scope (ftes.txt §2 Academic Profile + §3 Subject Workspace / Lecturer) expects richer academic identity: avatar, stats, achievements, and social links.

The data layer for this page is still mocked inside `useQueryCourseDetailSwr`. The public hook contract (`{ course, isLoading, error, mutate }`) and the `CourseDetail` component's usage of `course.instructor` are stable, so we can expand the shape and UI without touching any real API.

## Goals / Non-Goals

**Goals:**
- Replace the minimal instructor block with a credible, information-dense instructor card.
- Surface academic identity fields defined in ftes.txt: avatar, role, stats (courses taught, students, rating), achievements/credentials, and social links.
- Follow the house FE canon: use HeroUI + existing `reuseable` primitives, keep spacing on the `0/2/3/4/6` scale, and keep all strings behind i18n.
- Keep the change strictly FE-only and mock-driven.

**Non-Goals:**
- No new BE endpoint, no GraphQL contract, no real follow/subscribe mutation.
- No new reusable primitives; we consume the existing ones.
- No changes to page layout outside the instructor block.

## Decisions

- **Use `UserAvatar` for the avatar.** It already provides the fallback chain (uploaded URL → generated avatar → initials), matching §2 Academic Profile / Avatar. The mock will leave `avatarUrl` empty so the generated/initials fallback is exercised.
- **Use `StatRibbon` for headline stats.** It is the house component for horizontal icon/value/label strips. We will pass three items: courses, students, rating.
- **Use `FollowButton` for the follow action.** It is presentational and expects the parent to own state/mutation. Because there is no BE follow contract yet, the parent will keep a local `useState` toggle and mark it as a mock-only interaction.
- **Use HeroUI `Link` (or the primitive `Link` from `@heroui/react`) for social URLs.** We will render them as icon buttons with `aria-label`, `target="_blank"`, and `rel="noopener noreferrer"`. We do not use `ReferenceLinks` because that component is built for long alias+URL reference rows, not compact social icon links.
- **Keep the block inline in `CourseDetail/index.tsx`.** The instructor card is not reused elsewhere yet, so a separate `blocks/` component is premature. The JSX is still composed entirely of primitives, so it remains easy to extract later.
- **Mock data for "Lê Minh Quân".** The expanded mock will be plausible for a Vietnamese university lecturer: 12 courses, 3,400 students, 4.8 rating, achievements drawn from §2 Achievements/Certificates, and links to GitHub, LinkedIn, and a personal website.

## Risks / Trade-offs

- **[Risk] Mock data looks like real data.** → The hook comment already says "mock BE — no course endpoint yet"; we will keep that comment and not add any fake API path.
- **[Risk] `FollowButton` is a presentational toggle without persistence.** → Acceptable because the task explicitly says "nếu có reuseable/FollowButton thì tái dùng" and there is no BE follow contract. The toggle will reset on page reload; this is documented as a FE-only placeholder.
- **[Risk] Achievements use hardcoded Phosphor icons.** → The icon set is part of the design system; the list is short and local to this card.
