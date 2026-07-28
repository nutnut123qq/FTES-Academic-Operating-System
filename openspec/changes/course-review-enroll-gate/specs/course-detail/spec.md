# course-detail

## ADDED Requirements

### Requirement: Review composer gated on enrollment
The system SHALL prevent a signed-in viewer who is NOT enrolled in the course from entering a review, reusing the same enrollment signal the detail page's enroll CTA reads (`useCourseEnrollment().isEnrolled`). The star picker and review textarea remain visible but non-interactive for INPUT: attempting to type or pick a star surfaces a message that the viewer has not enrolled yet ("Bạn chưa đăng ký khóa học") instead of accepting the input. The submit gate and the server-side rating access check are unchanged.

#### Scenario: Non-enrolled viewer clicks the review textarea
- **WHEN** a signed-in but not-enrolled viewer clicks or focuses the "Đánh giá của bạn" textarea
- **THEN** no text is entered and a message tells them they have not enrolled in the course

#### Scenario: Non-enrolled viewer taps a star
- **WHEN** a signed-in but not-enrolled viewer clicks a star in the rating picker
- **THEN** no rating is selected and the same enroll-first message is shown

#### Scenario: Enrolled viewer is unaffected
- **WHEN** an enrolled viewer opens the review composer
- **THEN** the star picker and textarea accept input and the "Gửi đánh giá" submit works as before
