# Challenge list (tab "Thử thách") — UX brainstorm

> Trang: tab **Thử thách** trong lesson reader.
> Component: `LessonReader/ChallengeBody/` (`index.tsx` + `ChallengeCard/`).
> Route data: `useQueryChallengesSwr` (list) + `useQueryChallengeSubmissionProgressSwr` (progress, redux `challenge.completionTasks`).
> Yêu cầu thầy: **"dùng list style card đi"** → list các **card** (không phải hàng phẳng như hiện tại).

## Mục tiêu trang (≤30s)
Người học đang đọc 1 bài → tab này phải trả lời ngay: *bài này có mấy thử thách, khó cỡ nào, tôi đã làm tới đâu, bấm gì để (tiếp tục) làm*. → **1 primary action / card**, trạng thái cá nhân dẫn dắt, cắt vanity.

## Dữ liệu THẬT khả dụng (grounded)
List query trả full `ChallengeEntity`; progress là query riêng. Map field → UI:

| Dữ liệu | Nguồn (đã có) | Dùng trong card |
|---|---|---|
| `title` | list | tiêu đề (primary) |
| `description` | list | mô tả (clamp 2 dòng) |
| `score` | list | chip điểm (trophy) |
| `difficulty` | list — **5 tier**: easy/medium/hard/insane/**expert** | chip độ khó (màu theo tier) |
| `sortIndex` | list | đánh số "Thử thách N" + thứ tự |
| `status` | progress (`completionTasks`) | trạng thái → màu/icon + nhãn CTA |
| `lastScore` / `maxScore` | progress | "70/100" khi đang làm / đã xong |
| **`numAttempts`** | progress — **CHƯA dùng** | "đã thử N lần" (chỉ khi >0) |
| **`hint`** | list — **CHƯA dùng / chưa type FE** | chip "có gợi ý" (opt) |

**Cơ hội (field tồn tại, FE chưa khai thác):** `numAttempts`, `hint`, `displayId`, `orderIndex`.
**KHÔNG vẽ cái không có:** không có "số người giải", "ngôn ngữ", "acceptance %", "tags" trong payload → đừng bịa.

## Gap kỹ thuật cần xử lý ở bước apply
- ⚠️ FE enum `ChallengeDifficulty` **thiếu `expert`** (BE có 5 tier). `ChallengeCard` `switch(difficulty)` default về "Dễ" → `hard`/`insane`/`expert` hiển thị SAI nhãn. Phải bổ sung `insane`/`expert` + i18n + màu palette.
- `numAttempts`, `hint` chưa được type vào FE `ChallengeEntity` / không lấy ra hiển thị.
- `ChallengeBody` **không có nhánh error** (lỗi request render giống "rỗng" — chính là bug schema-drift vừa fix). Apply phải thêm **error/retry state** tách khỏi empty.
- Cả card phải **clickable + hover** (rule [[interactive-needs-hover]]): bọc `group`, title `group-hover:underline`, `cursor-pointer`; KHÔNG chỉ nút "Làm" mới bấm được.

## Các hướng (đã vẽ widget)
Ref tra cứu: [Codewars](https://www.codewars.com/) · Exercism exercise cards · bảng problem LeetCode · [so sánh nền tảng](https://scrimba.com/articles/best-coding-practice-platforms-and-challenge-websites-in-2026/).

### A — Thẻ học-viên, ưu tiên trạng thái  ✅ CHỐT (mỗi thử thách = 1 CARD; "đã thử" TRONG card — thầy chốt)
Mỗi thử thách = **1 card duy nhất** (KHÔNG tách 2 card, KHÔNG separator). Thứ tự trong card:
- eyebrow `[PuzzlePieceIcon] Thử thách N` + chip trạng thái (góc phải) → tiêu đề (16/500) → hàng meta `gap-2` (độ khó · điểm · gợi ý) → mô tả clamp 2 dòng →
- **hàng footer (TRONG card), `justify-between`:** trái = dòng tiến độ muted `[refresh] đã thử N lần · lastScore/maxScore` (chưa làm → "Chưa làm lần nào") · phải = **1 nút primary đổi nhãn theo trạng thái** (Chưa bắt đầu=*Làm* · Đang làm=*Tiếp tục* · Thất bại=*Thử lại* · Hoàn thành=*Xem lại*).

**"Đã thử" để TRONG card** (không phải caption ngoài): cohesion 1 card = trọn 1 thử thách (bounded object) + đặt cạnh nút theo logic "đang ở đâu → làm gì tiếp" + nhất quán với chip trạng thái đã ở trong card. **Nhịp:** giữa các card `gap-3`. Card hoàn thành mờ nhẹ (de-emphasize). **Icon challenge = `PuzzlePieceIcon`** (puzzle) cho motif "đây là thử thách"; `FlameIcon` CHỈ còn cho chip độ khó (cường độ), KHÔNG dùng flame làm icon challenge nữa.
- **Vì sao chốt:** đúng ngữ cảnh (cột đọc hẹp, chỉ 2–4 mục/bài), 1 primary action rõ, tận dụng `status`+`numAttempts` thật, tôn trọng [[one-progress-bar-at-a-time]] (dùng icon/chip trạng thái, KHÔNG thanh progress mỗi card), grounded Exercism/LeetCode.
- Trade-off: tốn chiều dọc hơn B — chấp nhận vì số mục ít.

### B — Hàng gọn kiểu "bảng bài toán" (LeetCode)
Hàng 1 dòng: icon trạng thái · "N. tiêu đề" (truncate) · pill độ khó · điểm · chevron. Quét nhanh, gọn.
- Trade-off: mất mô tả + cảm giác mời gọi; chỉ ~2–4 mục thì mật độ cao không cần thiết; khô với ngữ cảnh học. → loại.

### C — Bậc thang độ khó (Codewars/Duolingo)
Badge tier dẫn đầu + đường nối dọc gợi "leo dần" easy→expert.
- Trade-off: ngụ ý **khoá tuần tự** trong khi thực tế không gate theo tier (sai mental model). Để dành nếu sau này có cơ chế unlock thật. → loại (giờ).

## IA chốt (Direction A)
1. Header nhỏ: "N thử thách trong bài này" (giữ, đã có) — đếm thật từ `count`.
2. List card (gap-3 giữa các card) — mỗi card theo anatomy A.
3. Pagination giữ, chỉ hiện khi `count > pageSize`.
4. States: skeleton mirror (2 card) · **empty** ("chưa có thử thách") · **error** (retry) — phân biệt rõ.

→ Thầy duyệt A → `/starci-fe-ux-apply` dựng (kèm sửa enum/numAttempts/hint/error-state ở trên).
