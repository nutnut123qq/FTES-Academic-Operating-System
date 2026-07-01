# Flashcards (Quiz) — Freemium Gate UX Brainstorm

> Trang: `/[locale]/courses/[courseSlug]/learn/flashcards` (thầy gọi là **"quiz"**)
> Ngày: 2026-06-22 · Skill: `/ux-brainstorm` (MAX effort) · KHÔNG code, chỉ chốt hướng.
> Nối tiếp [[Flashcards/UX-BRAINSTORM.md]] (Hướng A spaced-rep ĐÃ DONE). Đây là **tầng gating freemium** chồng lên.

---

## 0. Bối cảnh & spec thầy

Spec freemium tổng (mới hơn plan cũ → **thắng** plan `backend/docs/freemium-preview-enrollment-plan.md`):

| Tính năng | Free (chỉ đăng nhập, `isPurchased=false`) |
|---|---|
| Đọc bài (học) | ✓ thoải mái |
| Challenges | ✓ **thoải mái** (khác plan cũ đã chốt là paid) |
| **Quiz (flashcard)** | ⚠️ **~20% miễn phí, ~80% cần premium** |
| Personal project | ✗ chặn |

Yêu cầu cụ thể cho trang quiz:
1. **"Quiz thêm isPremium vào"** → thêm cờ `isPremium` (per-item) để đánh dấu quiz nào premium.
2. **"đọc số quiz và giới hạn cỡ 80% cần premium, sửa data"** → ~80% số quiz là premium; cần **sửa seed/mount data** để gắn cờ.
3. **Thông báo / CTA mở khóa** → phải có upsell — điểm thầy nhấn. **CHỐT (thầy 2026-06-22): hành động mở khóa = ENROLL / ĐĂNG KÝ KHÓA HỌC (`isPurchased=true`), KHÔNG phải "nạp VIP"/membership riêng.** Quiz premium là phần *thực hành của khóa* → mở bằng cách mua/đăng ký khóa đó.

---

## 1. Hiện trạng (legacy = inventory)

Trang quiz hiện (sau Hướng A) gồm 3 view: **Home** (Hero "Đến hạn hôm nay" + StatsStrip + DeckList) · **Due** (ôn xuyên deck) · **Deck** (study flip+rate / interview).

`FlashcardDeckList` mỗi deck-card hiện: title · due chip · difficulty chip · mô tả · mastery bar · card-count · nút "Học".

**Chưa có gì về premium** — mọi deck/card đều mở. Không lock, không CTA nâng cấp, không "nạp VIP".

Dữ liệu THẬT khả dụng (BE): `FlashcardDeckEntity` (title, difficulty, cards[], dueCount, masteredCount) · `FlashcardCardEntity` (question, answer, level, tags, orderIndex) · `ContentEntity.isPremium` (đã có, deck N:N với content). **Chưa có** `isPremium` trên deck/card → cần thêm (đúng ý thầy "thêm isPremium vào").

---

## 2. Câu hỏi gốc phải chốt: **granularity của cờ premium**

"Quiz" = đơn vị nào để gắn `isPremium`?

- **G-A · Deck-level** — `isPremium` trên **deck**. ~80% deck là premium; ~20% deck (vd deck nền tảng đầu mỗi chủ đề) free. Khóa nguyên deck-card.
- **G-B · Card-level metered** — `isPremium` trên **card**. Trong mỗi deck, ~20% card đầu free, ~80% sau khóa. User vào deck nào cũng làm được vài thẻ rồi đụng tường.
- **G-C · Index-computed (không cờ)** — không thêm field; tính theo `orderIndex`: 20% đầu free, còn lại premium. ↳ **Loại** vì thầy nói rõ "thêm isPremium vào + sửa data" = muốn cờ tường minh + sửa data.

### So sánh (neo ref nghiên cứu)
| | G-A Deck-level ✅ ĐỀ XUẤT | G-B Card-level |
|---|---|---|
| Khớp ref | **LeetCode** (khóa per-row trong list) + **Headspace** (80% khóa OK *nếu* mỗi chủ đề chừa vài món free làm hook) | **Brilliant** (metered preview, làm vài thẻ/ngày rồi đụng giới hạn) |
| Data sửa | Nhẹ: gắn cờ ~N deck | Nặng: gắn cờ ~80% card từng deck |
| UX lock | Sạch: lock-badge trên deck-card, free-deck nổi lên trước | Đụng tường GIỮA phiên lật → cắt mạch học, dễ ức chế |
| Sunk-cost | "Bạn xong 2/2 quiz free, mở 8 quiz nữa" | "Bạn xong 4/5 thẻ free deck này, mở 20 thẻ" (mạnh hơn per-deck) |
| Due-queue (cross-deck) | Free due-queue = chỉ thẻ từ free-deck (gọn, dễ hiểu) | Free due-queue = 20% thẻ đầu mỗi deck (rối khi giải thích) |
| Rủi ro | 80% deck khóa → list toàn ổ khóa, **phải** surface free-deck rõ (bài học LeetCode) | gate mid-flow vi phạm "đừng cắt mạch task" (NN/g) |

→ **CHỐT G-A (deck-level)**: khớp pattern đã chứng minh (LeetCode per-row + Headspace curated-free), data nhẹ, UX lock sạch, đúng `flashcard ~20% deck` mà plan cũ §7 đã ghi. **Điều kiện bắt buộc** (bài học LeetCode): vì 80% khóa, **free-deck phải được surface cực rõ** (tách nhóm "Miễn phí" lên đầu / filter "Chỉ free"), không để chìm trong rừng khóa.

---

## 3. IA mới (tầng gating chồng lên Home hiện tại)

Giữ nguyên 3 view. Thêm/sửa:

### 3.1 Deck list — lock visible-but-inline (KHÔNG ẩn deck khóa)
- Mỗi deck-card thêm trạng thái: **Free** (mở) / **Premium-locked** (khóa).
- **Free deck**: như hiện tại + chip nhỏ **"Miễn phí"** (success tint) để nổi giá trị.
- **Locked deck**: icon ổ khóa + chip **"Premium"** (warning/accent tint) thay nút "Học"; card dim nhẹ (không blur nội dung title — title vẫn đọc được để "thèm"); bấm vào → **không vào deck** mà bật **paywall sheet** (§3.3).
- **Surface free rõ** (bắt buộc): sắp **free-deck lên đầu** + một **toggle/segment "Tất cả · Chỉ miễn phí"**. Cho phép đếm "Đang mở 2 · Khóa 8".

### 3.2 Hero "Đến hạn hôm nay" (free)
- Due-queue free chỉ gồm thẻ từ free-deck → vẫn có hàng đợi để tạo habit. Khi cạn: empty không nói "hết" cụt mà **"Đã ôn hết phần miễn phí — mở Premium để ôn N thẻ nữa"** (sunk-cost + CTA).

### 3.3 Paywall sheet — bật khi **chạm deck khóa** (đúng "moment of need", không bật lúc load)
- Tiêu đề: **"Mở khóa toàn bộ quiz"**. Copy **sunk-cost**: *"Bạn đã hoàn thành 2/2 quiz miễn phí của khóa này. Đăng ký khóa để luyện thêm **N quiz** (≈M thẻ)."*
- Liệt kê quyền lợi khi đăng ký (full quiz · ôn không giới hạn · challenges · …). 1 **primary CTA "Đăng ký khóa học"** (→ course detail/checkout) + 1 link phụ "Để sau" (dismissible).
- A11y: focus-trap, Esc đóng, `aria-modal`.

### 3.4 Thông báo upsell (điểm thầy nhấn) — 2 tầng, **nudge nhẹ, KHÔNG nag**
- **Tầng trong trang (contextual banner)**: 1 banner mảnh dismissible ở đầu quiz home: *"Bạn đang dùng quiz miễn phí (2/10). Đăng ký khóa để mở toàn bộ."* — dismiss thì ẩn (nhớ qua localStorage/flag), fire lại khi đụng deck khóa.
- **Tầng hệ thống (tận dụng NotificationEntity + Socket.IO đã có)**: sau khi user **làm xong phần free** (vd ôn hết free due-queue / hoàn thành free-deck cuối) → tạo **1 notification** *"Bạn đã chinh phục hết quiz miễn phí 👏 Đăng ký khóa để mở 8 quiz còn lại"* → đẩy realtime + chuông navbar. **Bắn 1 lần / có debounce**, không lặp mỗi lần đụng tường (tránh nag — ref Duolingo tự lọc notif khi user disengage).
- CTA route → **đăng ký/checkout khóa hiện tại** (§5).

---

## 4. Bảng Section → Dữ liệu BE/DB

| Section | Nguồn dữ liệu | Trạng thái |
|---|---|---|
| Deck free/locked badge | **`FlashcardDeckEntity.isPremium`** (mới) | ⚠️ CẦN BE: thêm cột + migration + seed |
| "Đang mở N · Khóa M" | đếm client từ `decks[].isPremium` + `isPurchased` | ✅ sau khi có field |
| Gate mở deck (free xem được deck nào) | `myEnrollment.isPurchased` (hoặc entitlement VIP) | ⚠️ CẦN BE: phân biệt free vs purchased (xem freemium plan §3 cache 2-set) |
| Due-queue free = thẻ free-deck | `myDueFlashcards` lọc theo deck free khi chưa purchased | ⚠️ CẦN BE: gate query |
| Paywall sunk-cost count | `decks` (free done / total) | ✅ client |
| Notification upsell enroll | `NotificationEntity` + emit `NotificationCreated` (đã có hạ tầng) | ⚠️ CẦN BE: chỗ trigger sau khi hết free |
| CTA "Đăng ký khóa học" route | course detail / checkout enroll | ✅ CHỐT §5 |

**Tóm tắt việc BE kéo theo (cho /ux-apply + biz fix sau):**
1. Thêm `isPremium boolean default false` vào `flashcard_decks` (+ migration) — đúng "thêm isPremium vào".
2. **Sửa seed/mount data**: gắn `# isPremium` cho ~80% deck (đọc tổng số deck/khóa, chừa ~20% free là deck nền tảng). → đúng "đọc số quiz, 80% cần premium, sửa data".
3. Gate query `flashcardDecksByCourse` / `myDueFlashcards`: nếu chưa purchased & `deck.isPremium` → trả `locked=true`, KHÔNG trả cards.
4. Trigger notification "nạp VIP" khi user hết phần free.

---

## 5. ✅ CHỐT — mở khóa = ENROLL khóa học (thầy 2026-06-22)

Hành động mở quiz premium = **đăng ký / mua khóa** (`EnrollmentEntity.isPurchased=true`), KHÔNG phải membership hay "nạp VIP". Quiz premium là phần *thực hành của khóa* → enroll khóa đó là mở.
- **Copy đổi toàn bộ**: "Nạp VIP" → **"Đăng ký khóa học"** / "Học khóa này" (enroll). Vương miện VIP → icon khóa/đăng ký.
- **CTA route** → trang chi tiết khóa / checkout enroll của khóa hiện tại (course detail / pricing), KHÔNG tới `/profile/ai-subscription` hay membership.
- **Gate** = `myEnrollment.isPurchased` (free-enroll login chỉ `isPurchased=false`). Đồng bộ freemium plan §2–§3 (cache 2-set enrolled-any vs purchased).
- Notification "hết phần free" copy: *"Bạn đã chinh phục hết quiz miễn phí 👏 Đăng ký khóa để mở N quiz còn lại"*.

---

## 6. Cắt / Thêm / Đổi
- **THÊM**: cờ `isPremium` deck · lock-badge + paywall sheet · contextual banner "đăng ký khóa" · system notification "hết free" · segment "Tất cả/Chỉ free" · empty due-queue sunk-cost.
- **ĐỔI**: deck-card có 2 trạng thái (free/locked); free-deck surface lên đầu.
- **CẮT**: không cắt gì của Hướng A.

## 7. Đừng-vỡ
- 80% khóa → **bắt buộc** surface free rõ (tách nhóm/filter), không để list toàn ổ khóa (bài học LeetCode).
- VIP notification **bắn 1 lần, dismissible, có debounce** — KHÔNG nag mỗi lần đụng tường (NN/g + Duolingo).
- Paywall bật **khi chạm deck khóa**, KHÔNG bật lúc load trang (post-value, ref Duolingo/NN/g).
- Title deck khóa vẫn đọc được (tạo "thèm"); chỉ chặn vào học, không blur tên.
