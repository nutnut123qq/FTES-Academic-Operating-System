# UX-BRAINSTORM — Lịch sử học cho người CHƯA ENROLL (trial) — render cho chuẩn (2026-06-23)

> Route `/profile/learning`. Thầy: *"mấy cái lịch sử học chưa enroll cũng xem được, brainstorm lại render cho chuẩn"*.
> Tiếp nối [UX-BRAINSTORM] (hub per-course + timeline). Trang đã viewable cho mọi user (account-level, KHÔNG bị
> EnrollGate vì là `/profile/*`). Câu hỏi mới: render gì cho người **chưa enroll**?

## 0. PHÁT HIỆN GỐC (đọc trước — đảo giả định)
- **Người chưa enroll đọc trial KHÔNG để lại record nào.** `markContentAsReaded` (ghi `user_contents.is_read`) bị
  **`GraphQLMustEnrolledGuard`** chặn → trial đọc bài nhưng **không lưu**. Tương tự `submission`/`milestone attempt`
  đều enroll-gated. ⇒ với người chưa enroll, **cả 3 trang history (Lịch sử học · Bài nộp · Lượt làm milestone) rỗng
  là ĐÚNG** — họ thật sự chưa có dữ liệu.
- `myCourses` (nguồn của hub) `FROM enrollments` → chỉ khóa đã enroll. Không có query "khóa đã đọc-thử".
- **Hệ quả:** "render cho chuẩn cho người chưa enroll" KHÔNG phải bug hiển thị — mà là **quyết định: có muốn trial
  để lại dấu vết + cho thấy không?** (funnel: trial xem lại mình đã đọc gì → động lực enroll).

## 1. Hai nhánh (cần thầy chốt — đổi scope hẳn)

### Nhánh 1 — "Ghi dấu trial + hiện lịch sử trial" (sản phẩm: biến trial thành history)
- **BE:** (a) cho phép ghi `user_contents.is_read` khi đọc trial **NHƯNG không cộng XP/activity** (chống XP-farming):
  nới guard ở `markContentAsReaded` (cho trial set `is_read` với `silent=true`, bỏ qua XP) — hoặc bảng/cờ "trial read"
  riêng. (b) thêm query **"khóa đã học-thử"** (distinct course từ `user_contents.is_read` mà `enrollments IS NULL`).
- **FE:** Lịch sử học = 2 nhóm: **"Đang học" (enrolled)** + **"Đã xem thử" (trialed)** — card trial có badge "Học thử"
  + CTA "Đăng ký để lưu tiến độ". → trang có nghĩa cho trial + nudge enroll.
- ✅ Đúng tinh thần "chưa enroll cũng xem được [lịch sử của mình]"; tăng conversion. ❌ đụng BE (guard + query mới) +
  cân nhắc XP-farming; cần thầy duyệt vì là quyết định sản phẩm.

### Nhánh 2 — "Giữ enrolled-only, làm EMPTY STATE chuẩn (onboarding)"
- KHÔNG đụng BE. Người chưa enroll → empty state **hướng dẫn** ("Lịch sử học ghi lại khi bạn tham gia 1 khóa" +
  "Khám phá khóa học"). Đồng bộ empty cho cả 3 trang (Lịch sử/Bài nộp/Milestone).
- ✅ Rẻ, trung thực (trial chưa có data thật). ❌ Trial đọc-thử vẫn vô hình → đúng "chưa chuẩn" nếu thầy muốn thấy trial.

## 2. Đề xuất
- Nếu thầy muốn **trial thấy được mình đã đọc gì** (funnel) → **Nhánh 1** (em sẽ làm BE: cho phép ghi is_read trial
  KHÔNG XP + query "đã học thử"; FE: tách nhóm Đang học / Đã xem thử + badge + CTA enroll).
- Nếu chỉ muốn **empty cho gọn/đúng** → **Nhánh 2** (chỉ FE: empty-state onboarding đồng bộ 3 trang).
- Mặc định em nghiêng **Nhánh 1** (đúng câu "chưa enroll cũng xem được [lịch sử]" + có giá trị funnel), nhưng vì
  đụng BE + sản phẩm nên **hỏi thầy trước**.

## 3. Ranh giới
- Dù nhánh nào: **submission/milestone vẫn enroll-only** (không thể có khi chưa enroll) → 2 trang đó chỉ cần empty
  onboarding (Nhánh 2), không có gì để "trial".
- Trang `/profile/*` KHÔNG bị `EnrollGate` (account-level) — giữ nguyên.
- KHÔNG bịa data: nếu không nới guard, FE **không thể** hiện lịch sử trial (không có record).
