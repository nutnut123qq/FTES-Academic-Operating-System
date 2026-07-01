# Draft — Mở khóa nội dung gated = ENROLL khóa học, KHÔNG phải "VIP"/membership riêng (2026-06-22)

- File/§ đích khi `/merge`: `main.md` §14 (heuristics product) + `starci-ui.rules` (paywall/upsell pattern nếu có).
- Bối cảnh: làm freemium gate cho quiz (flashcard) — ~20% free, ~80% premium. Lần đầu mình đặt CTA "Nạp VIP".
  Thầy sửa: *"không phải nạp vip mà là enroll vào"*.

## Luật (STRICT)
- **Mọi nội dung premium của 1 khóa (quiz/challenge/personal-project/lesson premium) mở khóa bằng ĐĂNG KÝ/MUA CHÍNH KHÓA ĐÓ**
  (`EnrollmentEntity.isPurchased=true`), KHÔNG dựng SKU "VIP"/membership/subscription riêng để gate.
  - Free = login → free-enroll (`isPurchased=false`): đọc bài + challenges + ~20% quiz.
  - Mở phần còn lại = enroll/checkout khóa đó.
- **Copy & CTA**: dùng **"Đăng ký khóa học" / "Học khóa này"** (enroll), KHÔNG "Nạp VIP", KHÔNG vương miện VIP. Icon = khóa/đăng ký.
- **CTA route** → trang chi tiết khóa / checkout enroll của *khóa hiện tại*, KHÔNG `/profile/ai-subscription`, KHÔNG trang membership.
- **Phân biệt 3 trục tiền** (đừng trộn): (a) **enroll khóa** = mở thực hành/nội dung khóa [← dùng cho gate học] ·
  (b) membership cộng đồng $5/th = blog premium + cộng đồng · (c) AI subscription = credit/model chấm AI. Gate học bám (a).
- Upsell notification cũng theo (a): *"Đăng ký khóa để mở N quiz còn lại"*, bắn 1 lần, dismissible (không nag).
- Ref: [[freemium-preview-enrollment-plan]] (isPurchased) · brainstorm `Flashcards/FREEMIUM-GATE-UX-BRAINSTORM.md`.
