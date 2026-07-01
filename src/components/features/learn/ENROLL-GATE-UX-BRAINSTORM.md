# UX-BRAINSTORM — Chặn surface `/learn/*` khi CHƯA enroll (enroll-gate, không để vỡ) (2026-06-23)

> KHÔNG code — brainstorm + chốt hướng. Target: các surface khu Learn cần enrollment (rõ nhất
> `/learn/personal-project`). Bối cảnh: người **chưa enroll** vào trang Dự án cá nhân → query milestone
> **throw `ENROLLMENT_NOT_FOUND`** → màn vỡ "Không tải được bài tập này" (ảnh thầy gửi).
> Ref: app đã có `LessonReader/PremiumPaywall` (lock→PaymentModal) + mô hình Coursera (materials xem thử, bài
> tập/dự án khoá sau enroll). Liên quan [[trial-preview-enrollment-optional]] (đã cho `myCourseOutline` preview).

---

## 0. TL;DR
- **Lỗi:** khu Learn **KHÔNG có cổng enrollment**. Trial (Học thử) chỉ được thiết kế cho **đọc nội dung**
  (`/learn/content`, BE đã sửa preview), nhưng sidebar vẫn cho bấm sang **Dự án cá nhân / Flashcards / Practice /
  Leaderboard / Nền tảng** → các query enroll-required **throw** → vỡ trang (không phải empty đẹp).
- **Sai UX:** thay vì "lỗi đỏ" cho người chưa mua, phải là **cổng mời enroll** ("Đăng ký để mở khoá Dự án cá nhân")
  — vừa chặn vừa **chuyển đổi** (Baymard/Coursera: locked → enroll CTA, KHÔNG để màn lỗi).
- **App đã có khuôn:** `PremiumPaywall` (lock icon + "Mở khoá" → `PaymentModal` flow CourseEnroll). → **nâng thành
  block dùng-chung `EnrollGate`** áp cho cả surface.
- **Chốt: H-A — `EnrollGate` tại chỗ (in-place) + lock ở sidebar** ✅. Trial vẫn đọc nội dung; surface khoá hiện
  cổng enroll ngay trên trang (không redirect cụt, không màn lỗi).

## 1. Khoanh vùng
| | |
|---|---|
| Trạng thái enroll (FE) | `state.user.enrolled` (bool) + `state.user.enrollment`, set bởi `useQueryCourseEnrollmentStatusSwr` |
| Layout learn | `app/.../learn/layout.tsx` + `LearnShell` — **KHÔNG có guard enrollment** (mount mọi route) |
| Trial entry | nút "Học thử" (CourseDetail) → `/learn/content` (chỉ định cho đọc nội dung) |
| Trang vỡ | `PersonalProject/**` gọi `useQueryMilestonesSwr` + `useQueryMilestoneTaskProgressSwr` → throw khi chưa enroll |
| Khuôn sẵn | `LessonReader/PremiumPaywall` (lock + "Mở khoá" → PaymentModal) · `PremiumGateModal` |

## 2. Surface nào TRIAL được, surface nào ENROLL-GATE (mô hình Coursera)
| Surface | Route | Cần enroll? | Lý do |
|---|---|---|---|
| **Nội dung/Lesson** | `/learn/content`, `/modules/...` | ❌ **Trial OK** | BE đã preview ([[trial-preview-enrollment-optional]]) — "materials" cho xem thử |
| **Sơ đồ tư duy** | `/learn/mind-map` | ❌ **Trial OK** | chỉ là bản đồ định hướng (orientation), không phải bài tập |
| **Dự án cá nhân** | `/learn/personal-project` | ✅ **GATE** | capstone — "assignment/project" Coursera khoá |
| **Flashcards** | `/learn/flashcards` | ✅ **GATE** | ôn tập cá nhân (SM-2 per-user, cần enrollment) |
| **Luyện thuật toán** | `/learn/practice` | ⚠️ **tuỳ** | nếu là practice GLOBAL (không course-scope) thì KHÔNG gate; nếu course-bound thì gate — *cần xác nhận* |
| **Bảng xếp hạng** | `/learn/leaderboard` | ✅ **GATE** | xếp hạng theo enrollment của khoá |
| **Nền tảng** | `/learn/foundations` | ✅ **GATE** | đã hard-gate `enrolled` (nhưng hiện rỗng, không có CTA) |

## 3. Điểm đau
1. **Màn LỖI thay vì cổng** — người chưa mua thấy "Không tải được bài tập này" (đỏ, như bug) → tệ + mất cơ hội bán.
2. **Sidebar không báo khoá** — mọi surface bấm được như nhau, không có lock → người trial lạc vào trang vỡ.
3. **Không có cổng surface-level** — chỉ có paywall **per-lesson** (premium content), chưa có cổng cho cả surface.
4. **Throw cứng ở hook** — `useQueryMilestonesSwr`/`useQueryMilestoneTaskProgressSwr` throw (không soft-fail), nên
   kể cả muốn empty cũng vỡ.

## 4. Mục tiêu
Người **chưa enroll** vào surface khoá → thấy NGAY **(a) đây là nội dung của khoá** + **(b) 1 nút "Đăng ký để mở
khoá"** (mở `PaymentModal`) + **(c) vẫn học thử nội dung được**. KHÔNG màn lỗi, KHÔNG redirect cụt. 1 primary = Đăng ký.

## 5. Ba hướng + CHỐT
### H-A — `EnrollGate` tại chỗ (in-place) + lock sidebar ✅ **CHỐT**
- **Block dùng-chung `EnrollGate`** (nâng từ `PremiumPaywall`): đọc `state.user.enrolled`; **chưa enroll → render
  cổng** (icon khoá + tiêu đề "Mở khoá <surface>" + mô tả + nút "Đăng ký" → `PaymentModal` CourseEnroll + link phụ
  "Học thử nội dung"); **đã enroll → render `children`** (feature thật). Wrap mỗi surface enroll-required.
- **Sidebar:** item enroll-required gắn **lock icon** khi chưa enroll (affordance), bấm vẫn vào trang → thấy cổng.
- ✅ Chặn + mời mua ngay (conversion), tái dùng khuôn app, không đụng BE (cổng chặn TRƯỚC khi gọi query throw),
  trial nội dung giữ nguyên. Ref: Coursera (locked assignment → enroll), app `PremiumPaywall`.
- ⚠️ cần `enrolled` đáng tin trong khu Learn (gate tự gọi `useQueryCourseEnrollmentStatusSwr` + xử lý loading để
  không nháy cổng).

### H-B — Redirect ở layout (chưa enroll + route khoá → đá về `/learn/content`)
- ✅ tập trung 1 chỗ. ❌ **cụt** (đá người dùng đi, mất cơ hội enroll tại chỗ), cần phân loại route + dễ nháy redirect.

### H-C — Soft-fail BE (query trả empty như `myCourseOutline`)
- ✅ hết throw. ❌ ra **empty câm** (không CTA), không "chặn có chủ đích" thầy muốn; vẫn nên làm NỀN (chống throw)
  nhưng KHÔNG đủ thay cổng.

**Chốt A** (có thể kèm C ở BE để query không throw, nhưng cổng FE là cái user thấy).

## 6. Section → dữ liệu (hướng A)
| Khối | Hiển thị | Nguồn |
|---|---|---|
| Cờ enroll | quyết định gate/feature | `state.user.enrolled` (`useQueryCourseEnrollmentStatusSwr`) |
| Cổng | icon khoá + "Mở khoá <surface>" + desc + **Đăng ký** + "Học thử nội dung" | i18n + `usePaymentOverlayState().open({flow:CourseEnroll})` + path `/learn/content` |
| Sidebar lock | lock icon trên item khoá khi `!enrolled` | nav items + `enrolled` |
| Feature | render khi `enrolled` | feature cũ |

## 7. Cắt / Thêm
- **THÊM:** block `EnrollGate` (surface-level) · lock affordance sidebar · (BE option) soft-fail cho milestone
  queries để không throw.
- **CẮT:** màn lỗi đỏ cho người chưa enroll ở surface khoá.
- **GIỮ:** trial đọc nội dung (`/learn/content`, mind-map) · `PremiumPaywall` per-lesson (premium content) · PaymentModal.

## 8. States / a11y / ranh giới
- **Loading enroll-status:** trong lúc `enrolled` chưa biết → skeleton/null (đừng nháy cổng rồi mất). Đã enroll =
  feature; chưa = cổng; lỗi enroll-status = cổng (an toàn, không lộ nội dung khoá).
- **a11y:** icon khoá có `aria-label`; nút Đăng ký là primary rõ; "Học thử" link phụ.
- **Phân loại surface dứt khoát** (xác nhận practice global hay course-bound) trước khi wrap.
- Ref: [Coursera locked content](https://www.coursera.support/) · app `PremiumPaywall` · [[trial-preview-enrollment-optional]].

→ Thầy chọn hướng (widget) → `/starci-fe-ux-apply`. Feedback → `.claude/rules/drafts/<temp>.md`.

---

## ✅ ĐÃ DỰNG 2026-06-23 (thầy duyệt — H-A, **bỏ link "Học thử nội dung"** vì đang trial sẵn rồi)
- **Block `EnrollGate`** (`features/learn/shared/EnrollGate`): icon khoá + title "Mở khoá {surface}" + desc + **1 nút
  "Đăng ký"** (→ `PaymentModal` flow CourseEnroll). KHÔNG có link học-thử. Mirror `PremiumPaywall`.
- **Gate ở `learn/layout.tsx`** (1 điểm, vì page các surface rỗng — render qua nested layout): load
  `useQueryCourseEnrollmentStatusSwr` → `state.user.enrolled`. `ENROLL_REQUIRED = {personal-project, flashcards,
  leaderboard, foundations}`. Surface khoá + **đã biết** chưa enroll → render `EnrollGate` + **bỏ luôn rail** (để
  MilestoneOutline/ContentMap không chạy query throw); đang resolve → Spinner (giữ feature lại); enrolled → render
  thật. Trial vẫn xem **content + mind-map**. (Practice CHƯA gate — chờ xác nhận global/course-bound.)
- **Lock sidebar:** `SidebarNavItem` thêm prop `endContent`; `useSidebarNavItems` set `locked` (khi biết-chưa-enroll)
  cho 4 surface; `LearnSidebar` hiện `LockSimpleIcon` cuối hàng.
- **Loading guard:** `enrolled` default `false` → chỉ gate/lock khi enrollment-status đã settle (tránh nháy gate cho
  người đã enroll). i18n `enrollGate.{title,description,cta,locked}` (vi/en). tsc + lint + JSON sạch.
