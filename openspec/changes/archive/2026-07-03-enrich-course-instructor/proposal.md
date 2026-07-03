## Why

The instructor block on the course detail page currently shows only the instructor's name, title, and a one-line bio. This does not match the depth expected for an academic course profile (ftes.txt §2 Academic Profile + §3 Lecturer) and undersells the instructor's credibility. A richer card will help learners trust the course before enrolling.

## What Changes

- Expand the `CourseInstructor` mock shape and TypeScript interface with:
  - `avatarUrl`
  - `role` (display role line)
  - `stats`: courses taught, total students, average rating
  - `achievements`: list of credential/achievement lines with icons
  - `links`: optional GitHub, LinkedIn, and website URLs
- Replace the minimal instructor JSX in `CourseDetail` with a full instructor card using house primitives:
  - `UserAvatar` for avatar + initials fallback
  - `StatRibbon` for headline stats
  - `FollowButton` for the "Theo dõi" / "Follow" action
  - `Link` for social URLs (new-tab-safe, with `aria-label`)
- Add i18n keys for the new labels in both `vi.json` and `en.json` under `courseSystem.detail.instructor.*`.
- Keep the change FE-only: the data stays mocked inside `useQueryCourseDetailSwr` and the hook's public API does not change.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `course-detail`: the instructor section of the course detail page is expanded from name + title + one-line bio to a full instructor profile card.

## Impact

- Affected files:
  - `src/components/features/course/hooks/useQueryCourseDetailSwr.ts` (type + mock)
  - `src/components/features/course/CourseDetail/index.tsx` (instructor card UI)
  - `src/messages/vi.json` and `src/messages/en.json` (new i18n keys)
- No BE contract changes; no API endpoints added or assumed.
- No routing or navigation changes.
