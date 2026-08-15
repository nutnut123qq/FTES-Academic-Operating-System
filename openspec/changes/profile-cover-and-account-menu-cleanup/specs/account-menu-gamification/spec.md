# account-menu-gamification (delta)

## ADDED Requirements

### Requirement: The account menu does not duplicate the dashboard course list

The signed-in account dropdown SHALL NOT carry a "Khóa học của tôi" row. The dashboard row directly
above it opens the 4-tab cockpit whose Courses tab reads the SAME enrollment adapter
(`GET /courses/me/enrollments`) and lists every enrolment with progress and a resume link, so the
extra row was a second door onto the same data.

The learning section SHALL only exist for viewers who have something in it: with "Khoá tôi dạy"
gated on the lecturer permission, the whole section — and therefore its separator — SHALL NOT
render for a learner.

`/courses/me` SHALL remain reachable: it stays linked from the home landing "Xem tất cả" control
and from the quest board `LESSON_COMPLETE` CTA, so removing the menu row orphans no route.

#### Scenario: A learner opens the account menu

- **WHEN** a signed-in learner without the teaching permission opens the account dropdown
- **THEN** "Bảng điều khiển" renders, "Khóa học của tôi" does not, and no empty learning section or
  stray separator is shown

#### Scenario: A lecturer opens the account menu

- **WHEN** a signed-in viewer holding the teaching permission opens the account dropdown
- **THEN** the learning section renders with "Khoá tôi dạy" only, routing to `/courses/teaching`

#### Scenario: End-to-end anchor row

- **WHEN** an automated test needs to wait for the authed menu to resolve
- **THEN** it anchors on the ungated "Bảng điều khiển" row, since "Khóa học của tôi" no longer exists
