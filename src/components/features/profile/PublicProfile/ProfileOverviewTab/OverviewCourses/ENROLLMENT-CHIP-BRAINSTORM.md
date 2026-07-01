# Course list — enrolled vs trial chip (2026-06-25)

> Hiển thị 1 chip phân biệt **đã đăng ký (trả tiền)** vs **học thử (trial)** trên mỗi course row.
> Vẫn track tiến độ CẢ HAI; chỉ thêm chip. Áp cho cả profile `OverviewCourses` + dashboard `CourseRow`
> (cùng dùng `MyCourseItemData`). KHÔNG code ở đây.

## Bối cảnh model
Sau migration enrollment-centric: mỗi enrollment có `is_enrolled` (true = paid, false = trial placeholder do "Học thử"). Trial vẫn track progress + vẫn hiện trong "Khóa học của tôi" → giờ cần chip để người dùng biết khóa nào mới đang học thử.

## Dữ liệu (grounded)
- **BE — field CHƯA expose (cơ hội):** `MyCourseItemData` (dùng bởi `myCourses` dashboard + `userCourses` profile) **chưa có `isEnrolled`**. Nguồn `getMyCourseProgress` đã `FROM enrollments e` → thêm `e.is_enrolled AS is_enrolled` vào SELECT + field `isEnrolled: boolean` vào `MyCourseItemData` + map ở 2 resolver (`my-courses.resolver`, `user-courses.resolver`). 1 cột SQL + 1 field, không query mới.
- **FE row anatomy** (OverviewCourses + CourseRow): `[IconTile] [title flex-1 truncate] [percent]` + `SegmentBar`. Chip chèn vào hàng title (giữa title ↔ percent).

## Rules áp
- [[highlight-accent-as-detail-not-block-fill]]: đánh dấu trạng thái = **chip nhỏ** (detail), KHÔNG tô nền cả row.
- Status chip sáng `bg-token/10 text-token` ([[three-tier-page-layout]] chip), [[no-uppercase-text]], [[no-emoji]].
- **design-restraint:** chỉ đánh dấu **NGOẠI LỆ** — paid là norm (không chip), trial là ngoại lệ (có chip).

## 3 hướng (xem widget)
| Hướng | Cách | Trade-off |
|---|---|---|
| **A** ✅ | **Chỉ chip "Học thử"** ở row trial; paid không chip | ít nhiễu nhất, nudge nâng cấp tinh tế, row paid sạch |
| **B** | Cả hai: "Đã đăng ký" (success) + "Học thử" (warning) mọi row | rõ tuyệt đối nhưng chip trên MỌI row = nặng; "Đã đăng ký" mặc định → đánh dấu thừa |
| **C** | Trial = "· Học thử" text mờ inline, không chip | nhẹ nhất, tín hiệu yếu, dễ bỏ qua |

### Chốt đề xuất: **A — chip "Học thử" only**
- Đúng design-restraint (mark exception). Row người trả tiền giữ sạch (họ là norm).
- Chip tone = **warning-soft** (`bg-warning/10 text-warning`) — "đang xem thử", nudge enroll nhẹ. (Alt: neutral `bg-default text-muted` nếu muốn trung tính hơn.)
- Vị trí: sau title, trước percent: `[title min-w-0 flex-1 truncate] [chip shrink-0] [percent shrink-0]`.
- HeroUI `<Chip size="sm" variant="soft" color="warning">{t("course.trial")}</Chip>`.

## Section → dữ liệu
| Phần | Field |
|---|---|
| Chip "Học thử" (gate hiển thị) | `MyCourseItemData.isEnrolled === false` (MỚI — cần BE expose) |
| Row (giữ nguyên) | label, thumbnailUrl, contentCompleted/Total, challengeCompleted/Total, completed/total, completionPercent |

## Cắt / thêm
- **Thêm BE:** `isEnrolled` trên `MyCourseItemData` + SQL + 2 resolver map.
- **Thêm FE:** chip ở OverviewCourses + CourseRow; i18n `course.trial` ("Học thử" / "Trial").
- **Không đổi:** progress vẫn track + render cho cả trial (đúng yêu cầu).

## CHỐT (thầy duyệt 2026-06-25)
1. **Hướng A** — chỉ chip "Học thử" (warning-soft) ở row trial; row paid không chip.
2. **Privacy = ẨN chip trial ở public profile của NGƯỜI KHÁC.** Chỉ chính chủ thấy trạng thái trial của mình (dashboard "Khóa học của tôi" + own profile + settings learning-history). Xem profile người khác → KHÔNG hiện chip (không lộ "chưa trả tiền"). → `OverviewCourses` gate chip thêm điều kiện `isOwnProfile`.
3. **Áp MỌI nơi render list khóa-học-đã-tham-gia:** dashboard `CourseRow`, profile `OverviewCourses` (gate own), settings `LearningHistory`(+`CourseDetail`). Skip legacy `PublicProfileLegacy/ProfileCourses`.
4. **BE:** thêm `isEnrolled` vào `MyCourseItemData` (SQL `e.is_enrolled` + field + map ở `my-courses.resolver` & `user-courses.resolver`) → cả myCourses + userCourses có field.
→ Sẵn sàng apply.

## Liên quan (KHÔNG thuộc chip — ghi để nhớ)
- **Leaderboard đảo policy:** thầy chốt mới = **leaderboard TRONG course track CẢ trial** → đảo lại filter `is_enrolled = true` đã thêm ở `getLeaderboard` + `getMyRank` (BE). Việc riêng, không thuộc brainstorm chip này.
