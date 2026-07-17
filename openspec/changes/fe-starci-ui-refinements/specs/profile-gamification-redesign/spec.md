# profile-gamification-redesign

## ADDED Requirements

### Requirement: Identity column with gamification identity
The `/profile` page SHALL render a left identity column in the StarCI `PublicProfile` style,
stacking: the avatar, a **level chip** (`SelfProfile.level`), the **@username**, a
**followers / following** count row (`SelfProfile.followers` / `following`), earned **badges**,
an **Edit profile** button and a **Share profile** button, and a **Joined date** line
(`SelfProfile.createdAt`, month + year). All values map from the existing `SelfProfile`
contract; a missing value hides its own row (no fabricated data).

Nơi sửa: `src/components/features/profile/ProfileShell/index.tsx` (identity sidebar);
`src/components/features/profile/hooks/useQueryProfileSwr.ts` (`toShellProfile` bổ sung
`level`/`username`/`followers`/`following`/`createdAt`). i18n `profile.level`,
`profile.followers`, `profile.following`, `profile.joined`, `profile.shareProfile`.

#### Scenario: Identity column renders real profile data
- **GIVEN** the signed-in viewer's `SelfProfile` is loaded
- **THEN** the identity column shows the avatar, level chip, @username, followers/following,
  badges, Edit and Share profile buttons, and the joined date

#### Scenario: Missing field hides its row
- **GIVEN** a profile field (e.g. badges) is empty
- **THEN** that row is omitted and no placeholder value is shown

### Requirement: Courses section maps real enrolled courses
The profile SHALL show a **Courses** section on the right where each enrolled course renders as
a card carrying a **Trial / Enrolled** badge, the **completion percent**, a **progress bar**,
and a line of **Content / Challenges / Milestone** counts. Data maps from the real
`useQueryMyCoursesSwr` (and its progress fields); a count with no backing field is omitted
rather than mocked. An empty state renders when the viewer has no courses.

Nơi sửa: `src/components/features/profile/ProfilePersonal/index.tsx` (hoặc component Courses
mới); hook `src/components/features/course/hooks/useQueryMyCoursesSwr.ts`. i18n
`profile.courses.*` (trial/enrolled/counts/empty).

#### Scenario: Enrolled course card shows progress and counts
- **GIVEN** the viewer has active enrollments
- **THEN** each course card shows a Trial/Enrolled badge, completion percent, a progress bar,
  and the available Content/Challenges/Milestone counts

#### Scenario: No enrolled courses
- **GIVEN** the viewer has no active enrollments
- **THEN** the Courses section shows a proper empty state

### Requirement: Contributions heatmap from real activity data
The profile SHALL show a **Contributions** section using the real activity heatmap: cells from
`GET /gamification/me/activity-days` (via `useGetMyActivityDaysSwr` + the `StreakHeatmap`
block), a **year selector**, and a **"{n}-day streak · longest {m}"** line sourced from
`GET /gamification/me/streak` (via `useGetMyStreakSwr`, `currentStreak` / `longestStreak`).
Loading uses `AsyncContent` with a skeleton; no activity numbers are fabricated.

Nơi sửa: component Contributions mới trong profile; hooks
`src/hooks/swr/api/rest/queries/useGetMyActivityDaysSwr.ts`,
`useGetMyStreakSwr.ts`; block `src/components/features/gamification/StreakHeatmap/index.tsx`.
i18n `profile.contributions.*` (year, streakLine).

#### Scenario: Heatmap and streak line reflect real data
- **GIVEN** the viewer is authenticated
- **THEN** the heatmap shades from the activity-days response and the streak line reads the
  current and longest streak from the streak endpoint

#### Scenario: Changing the year refetches the window
- **WHEN** the viewer selects a different year
- **THEN** the heatmap re-keys to that year's activity window

### Requirement: Empty states for data-less sections
Sections without a real data source — **Job readiness** and **Skills** — SHALL render a
tasteful empty state (icon + "coming soon" copy) in the StarCI style, and SHALL NOT display
mocked figures.

Nơi sửa: profile sections Job readiness / Skills dùng `EmptyContent`
(`src/components/blocks/async/EmptyContent`). i18n `profile.empty.jobReadiness`,
`profile.empty.skills`.

#### Scenario: Job readiness and skills show empty states
- **WHEN** the profile renders the Job readiness or Skills section
- **THEN** each shows an empty state with no fabricated numbers

### Requirement: Existing profile sub-routes are preserved
The redesign SHALL keep the existing profile sub-routes and section tab bar
(`academic`, `portfolio`, `certificates`, `community`, `progress`); only the `/profile` root
(personal) content and the identity sidebar are restructured.

Nơi sửa: `src/components/features/profile/ProfileShell/index.tsx` (`SECTIONS` tab bar giữ
nguyên); các trang `src/app/[locale]/profile/*` giữ nguyên.

#### Scenario: Sub-routes still reachable
- **WHEN** the viewer opens a profile section tab (e.g. Portfolio)
- **THEN** the corresponding existing sub-route still renders as before
