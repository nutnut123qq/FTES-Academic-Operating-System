# course-detail Specification

## Purpose
TBD - created by archiving change course-detail-sales-layout. Update Purpose after archive.
## Requirements
### Requirement: Course detail sales layout
The course detail page at `/courses/[courseId]` SHALL present a two-column sales layout: a left content column and a sticky right enroll card. Data is FE-mocked until the BE course contract lands.

#### Scenario: Two-column layout with sticky enroll card
- **WHEN** a user opens a course detail page on a `md`+ viewport
- **THEN** the left column shows the hero, "what you'll learn", the syllabus, reviews, and the instructor
- **AND** the right column shows an enroll card (cover, price, tier selector, CTA, "what's included") that sticks while the left column scrolls

#### Scenario: Price is VND-primary with a USD reference
- **WHEN** the enroll card renders the price
- **THEN** the charged VND amount is shown prominently via the PriceTag block (with any struck original)
- **AND** the USD figure is shown below as a muted reference

#### Scenario: Enroll card shows two enrollment tiers
- **WHEN** the user is not yet enrolled
- **THEN** the enroll card displays a Free tier and a Premium tier
- **AND** the user can switch between the two tiers
- **AND** each tier shows its name, badge when applicable, and a distinct benefit list

#### Scenario: Free tier benefits
- **WHEN** the Free tier is selected
- **THEN** the benefit list reflects preview access (~20% content), readable lessons, and challenges
- **AND** the certificate item is shown as unavailable or omitted

#### Scenario: Premium tier benefits
- **WHEN** the Premium tier is selected
- **THEN** the benefit list reflects full video access, all lessons, all challenges, and a completion certificate

#### Scenario: CTA enrolls, never "buys"
- **WHEN** the user presses the primary CTA
- **THEN** the label reads "Đăng ký học" / "Enroll" and routes to the course enroll flow
- **AND** no "buy"/"VIP" copy or membership upsell is shown

#### Scenario: Try-free CTA starts a trial
- **WHEN** the user presses the secondary "Học thử miễn phí" / "Try for free" CTA
- **THEN** the system best-effort calls the existing `startTrial` mutation
- **AND** the user is routed into the course content regardless of mutation outcome

#### Scenario: Enrolled state shows a single continue CTA
- **WHEN** the user is already enrolled
- **THEN** the tier selector and price are hidden
- **AND** a single primary CTA labeled "Tiếp tục học" / "Continue Learning" is shown
- **AND** pressing it routes the user into the course content

#### Scenario: Syllabus preview with durations and premium markers
- **WHEN** the syllabus renders
- **THEN** chapters expand and collapse (first chapter open by default)
- **AND** each lesson shows its duration, and premium lessons show a lock + a "Premium" chip

#### Scenario: Loading and error states
- **WHEN** the course data is loading
- **THEN** a skeleton mirroring the two-column layout is shown
- **WHEN** loading fails with no cached data
- **THEN** an error state with a retry action is shown

### Requirement: Instructor profile card
The course detail page SHALL render a rich instructor profile card in the left content column, replacing the previous minimal name/title/bio block.

#### Scenario: Instructor card shows identity and credibility
- **WHEN** the instructor section renders
- **THEN** it displays the instructor avatar with a fallback to initials, the instructor name, and a role line
- **AND** it shows three headline stats: courses taught, total students, and average rating
- **AND** it shows a 2–3 sentence bio
- **AND** it lists credentials/achievements with icons
- **AND** it provides working social links (GitHub, LinkedIn, website) that open in a new tab with accessible labels
- **AND** it provides a follow/unfollow toggle button

#### Scenario: Missing optional fields degrade gracefully
- **WHEN** the instructor has no avatar URL
- **THEN** the avatar falls back to generated default or initials
- **AND** when any social link is absent, that icon is not rendered

#### Scenario: Follow action is FE-only until BE contract lands
- **WHEN** the user presses the follow/unfollow button
- **THEN** the button toggles its visual state immediately
- **AND** the interaction is mocked locally; no BE request is made

### Requirement: Nhãn entitlement của card chọn gói

Card chọn gói ở trang chi tiết khoá SHALL gắn nhãn cố định "Trọn khóa" (en: "Full course") cho mọi gói có ít nhất một entitlement `type` bằng `COURSE` (so sánh sau khi trim, không phân biệt hoa/thường) và MUST NOT hiển thị bất kỳ con số đếm nào cho gói đó; nhưng khi nhãn đó TRÙNG tên gói thì card MUST NOT render nhãn, để cùng một chuỗi không bị in hai lần. Phép so trùng SHALL chuẩn hoá cả hai vế trước khi so: bỏ dấu tiếng Việt, trim, lowercase, gộp khoảng trắng thừa — nên "Trọn khoá", "Trọn khóa", "TRỌN KHOÁ" và "Trọn  khoá" đều được coi là trùng nhau. Gói không có entitlement `COURSE` SHALL giữ nguyên cách đếm hiện có `{count} phần` với `count` là số phần tử `entitlements`, và khi `count = 0` thì MUST NOT render annotation. Khoá i18n `detail.wholeCourse` và `detail.package.entitlementFullCourse` SHALL dùng cùng một biến thể chính tả tiếng Việt ("Trọn khóa"), và bộ khoá `vi`/`en` SHALL không lệch nhau.

#### Scenario: Gói auto-upgrade tên trùng nhãn

- **WHEN** gói có `name = "Trọn khoá"` và `entitlements = [{ type: "COURSE" }]`
- **THEN** hàng gói SHALL chỉ chứa chuỗi "Trọn kho..." ĐÚNG MỘT lần (tên gói)
- **AND** MUST NOT render thêm nhãn entitlement bên cạnh tên

#### Scenario: Gói toàn khoá tên KHÁC nhãn

- **WHEN** gói có `name = "Gói VIP"` và `entitlements = [{ type: "COURSE" }]`
- **THEN** hàng gói SHALL hiện "Gói VIP" kèm nhãn "Trọn khóa"

#### Scenario: Trùng bất kể dấu, hoa thường, khoảng trắng thừa

- **WHEN** gói có `name = "  TRỌN   KHOÁ "` và `entitlements = [{ type: "COURSE" }]`
- **THEN** nhãn entitlement MUST NOT được render (coi là trùng tên gói)

#### Scenario: Gói theo phần giữ nguyên cách đếm

- **WHEN** gói có `entitlements = [{ type: "PART" }, { type: "PART" }]` và không có `COURSE`
- **THEN** annotation SHALL là "2 phần" y như trước khi có luật dedupe
- **AND** một gói có `entitlements` rỗng hoặc thiếu SHALL không render annotation

#### Scenario: Chính tả thống nhất trên cùng một trang

- **WHEN** đọc `src/messages/vi.json`
- **THEN** `detail.wholeCourse` và `detail.package.entitlementFullCourse` SHALL cùng là "Trọn khóa"

### Requirement: Card mua của khoá LEGACY chỉ hiển thị dữ liệu có thật

Card mua của khoá `saleMode = "LEGACY"` (hoặc thiếu `saleMode`) SHALL hiển thị đúng một lựa chọn trả phí đại diện cho việc mua trọn khoá, với giá bán, giá gạch (chỉ
khi giá gốc thực sự cao hơn giá bán) và % giảm suy ra từ hai giá đó. Card SHALL KHÔNG hiển thị bất kỳ
"gói"/"tier" nào mà BE không trả về — cụ thể là bỏ hai tier "Free"/"Premium" do FE dựng.

Lối vào "Học thử miễn phí" SHALL chỉ render khi khoá thật sự có bài học thử. Danh sách quyền lợi
SHALL chỉ gồm các mục có số liệu thật từ hợp đồng BE (số bài học, số bài học thử); các mục không có
nguồn dữ liệu SHALL bị bỏ khỏi card.

Card SHALL dùng cùng thành phần trình bày một lựa chọn mua với card của khoá `PACKAGE`, để hai loại
khoá có cùng bố cục, cách hiện giá, chip và nút.

Người học đã đăng ký SHALL vẫn thấy card thu về một nút "Tiếp tục học" như hiện tại.

#### Scenario: Khoá legacy trả phí có giảm giá
- **WHEN** một khoá LEGACY có giá gốc 800000 và giá bán 500000 được mở bởi người chưa đăng ký
- **THEN** card hiện một lựa chọn "Trọn khoá" giá 500000, giá gạch 800000 và chip giảm 38%
- **AND** không có tier "Free" hay "Premium" nào xuất hiện

#### Scenario: Khoá legacy không có bài học thử
- **WHEN** khoá LEGACY không có bài nào cho học thử
- **THEN** card không render nút "Học thử miễn phí"

#### Scenario: Không hứa thứ không có dữ liệu
- **WHEN** hợp đồng BE không trả số challenge của khoá
- **THEN** card không hiển thị dòng quyền lợi nào về challenge hay chứng chỉ

#### Scenario: Người đã đăng ký
- **WHEN** người học đã đăng ký khoá LEGACY mở trang
- **THEN** card chỉ hiện nút "Tiếp tục học" kèm dòng ghi chú như hiện tại

