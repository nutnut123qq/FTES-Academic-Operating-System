## MODIFIED Requirements

### Requirement: Shared enrollment intent hook
The system SHALL expose a feature hook that centralizes the three enrollment-related
actions for a course detail page: enroll, continue learning, and try learning. The
`onEnroll` action SHALL run the REAL checkout: resolve the course's COURSE_UNLOCK product
(`useGetCourseProductSwr` for `buy.rawId`), add it to the cart
(`usePostAddCartItemSwr`), and open the shared payment modal via
`usePaymentOverlayState().open({ itemIds, title, amountVnd, amountCoin? })` — the
`commerce-payment-modal` capability (from `commerce-checkout-flows`), which renders the
VietQR QR / Xu payment and polls the order to PAID. When the product is not resolvable
(no `rawId` / not on sale), `onEnroll` SHALL fall back to routing to the course sales page.
Guests SHALL be routed through the auth guard before any gated action.

#### Scenario: Enroll opens the payment modal with the course product
- **WHEN** a learner presses enroll on a course that is on sale
- **THEN** the hook resolves the COURSE_UNLOCK product, adds it to the cart, and opens the shared PaymentModal
- **AND** the PaymentModal shows the VietQR QR (and the Xu tab when the product has a coin price)

#### Scenario: Enroll falls back to the sales page when not purchasable
- **WHEN** a learner presses enroll on a course with no resolvable unlock product
- **THEN** the hook routes the learner to the course sales page instead of opening the modal

#### Scenario: Guest is guarded before enroll
- **WHEN** a signed-out viewer presses enroll
- **THEN** the auth guard runs first and the checkout proceeds only after authentication

#### Scenario: Hook provides continue-learning intent
- **WHEN** the learner is already enrolled in the course
- **THEN** the hook returns an `onContinueLearning` callback that routes the learner into the course content

#### Scenario: Hook provides try-learning intent
- **WHEN** the learner presses "Học thử miễn phí"
- **THEN** the hook best-effort calls the `startTrial` mutation for the current course
- **AND** the hook routes the learner into the course content regardless of mutation success or failure

#### Scenario: Hook derives enrolled state from the course detail contract
- **WHEN** the `CourseDetail` contract includes `enrollment.isEnrolled`
- **THEN** the hook reports `isEnrolled = true` when `enrollment.isEnrolled` is true
- **AND** the hook reports `isEnrolled = false` when the field is absent or false

#### Scenario: Locked lesson paywall opens the same payment modal
- **WHEN** an unentitled viewer presses the enroll button on the lesson-reader locked paywall
- **THEN** the same shared PaymentModal is opened for the course (resolved from `lesson.courseRawId`)
- **AND** it falls back to the course sales page only when the unlock product is unresolvable
