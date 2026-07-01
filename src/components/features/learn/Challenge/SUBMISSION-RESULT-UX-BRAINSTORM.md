# UX Brainstorm — Xem kết quả chấm bài (challenge submission result) (2026-06-23)

> Redesign phần "xem kết quả" — hiện là **drawer → modal lồng nhau**, khó đọc. Hướng: **trang kết quả riêng**.

## Hiện trạng (legacy = inventory, KHÔNG bê tư duy)
3 lớp:
1. **Inline** `SubmissionRow/LastAttemptResult` — preview ngay trong panel Nộp bài: pass/fail + score + tối đa 3 feedback gọn.
2. **Drawer** `drawers/SubmissionAttemptsDrawer` ("Lịch sử nộp bài") — list lần thử (`useQuerySubmissionAttemptsSwr`).
3. **Modal** `modals/FeedbackDetailsModal` ("Chi tiết phản hồi") — MỞ TRÊN drawer (`useQuerySubmissionFeedbacksSwr`).
- **Pain:** overlay chồng overlay (drawer→modal); vùng đọc hẹp; `detail`/`suggestion` (code) bị nén; không so sánh được các lần thử; không deep-link/chia sẻ được; trùng pattern với `UserMilestoneTaskFeedbacksModal` (personal-project) → 2 chỗ maintain.

## Mục tiêu trang (job)
Học viên vừa nộp xong, cần trong ≤30s: **(1) Đạt/chưa + điểm**, **(2) sai ở đâu (feedback theo mức ưu tiên + file:line)**, **(3) cách sửa (suggestion/code)**, **(4) xem lại bài nộp + so các lần thử**. → đọc thoải mái, không overlay.

## Dữ liệu thật (grounded — KHÔNG cần BE mới cho hướng chốt)
| Khối | Field BE (đã có) |
|---|---|
| Verdict + điểm | attempt `score` · submission `score`(max) · `status` (pending/passed/failed) |
| Meta lần thử | `attemptNumber` · `processedAt` · `submissionUrl` (artifact GitHub) · `shortFeedback` |
| Feedback item | `message` · `detail` · `severity`(low/med/high) · `location`(file:line) · `suggestion` |
| So sánh lần thử | list `userChallengeSubmissionAttempts` (score theo từng lần) |
| Query | `userChallengeSubmissionAttempts`, `userChallengeSubmissionFeedbacks` (đã có) |
**Cơ hội (field có, FE chưa khai thác):** gom feedback **theo severity** (Cao/TB/Thấp/Hoàn hảo); hiện đầy đủ `detail` + `suggestion` (code block); link `location`→GitHub; trend điểm qua các lần thử; link `submissionUrl`.
**Gap BE (ghi rõ, KHÔNG fake):** feedback **không** join tới criteria → CHƯA gom "Approach vs Outcome" / theo từng yêu cầu được; điểm flat (không tách approach/outcome per-attempt). Muốn breakdown theo yêu cầu = cần BE thêm `criteriaId` + expose. Hướng chốt KHÔNG phụ thuộc cái này (gom theo severity là đủ).

## Các hướng
- **A — Trang kết quả riêng (master–detail) [CHỐT].** Route riêng (vd `…/challenges/<id>/result?attempt=<id>` hoặc dùng chung detail cho profile submissions). Trái = timeline các lần thử (score trend); phải = header (verdict + score + artifact link) → feedback **gom theo severity** (Ưu tiên cao → TB → Thấp → Hoàn hảo), mỗi card = message (markdown) + location (file:line → GitHub) + suggestion (code). Ref: **LeetCode/Codility submission detail**, **GitHub PR review**, **SonarQube issues**.
  - ✅ Hết overlay; vùng đọc rộng; deep-link/chia sẻ; **dùng chung** làm trang detail cho `/profile/settings/submissions` + `/attempts` (1 trang nuôi 3 lối vào); mở rộng cho milestone (gộp `UserMilestoneTaskFeedbacks` cùng layout).
  - ⚠️ Rời trang giải (cần back rõ "← Quay lại thử thách"); thêm route.
- **B — Tab "Kết quả" tại chỗ trong panel Nộp bài.** Panel phải đổi tab Nộp bài ↔ Kết quả, feedback inline (không overlay, không rời trang). Ref: GitHub PR "Conversation/Files" tab.
  - ✅ Giữ context, không navigate; tái dùng panel có sẵn.
  - ⚠️ Panel hẹp → file:line + code chật; nhiều submission requirement (mỗi cái 1 chuỗi attempt) khó nhồi; không deep-link.
- **C — Gộp 1 drawer master–detail (bỏ modal lồng).** Giữ 1 drawer: trái list lần thử, phải feedback (bỏ modal thứ 2), drawer rộng hơn.
  - ✅ Sửa ít nhất, bỏ đúng pain (modal lồng).
  - ⚠️ Vẫn là overlay (thầy muốn trang); vẫn hẹp; không deep-link/dùng chung.

## CHỐT: Hướng A (trang riêng master–detail)
Lý do: đúng yêu cầu thầy ("trang riêng"), bỏ tận gốc overlay-chồng-overlay, vùng đọc rộng cho code/suggestion, **1 trang dùng cho 3 lối vào** (solve flow + profile submissions + attempts) + nền để gộp milestone feedback. B/C chỉ là fallback nếu muốn giữ-trong-context / sửa-tối-thiểu.

## IA hướng A
1. **Back** "← Quay lại thử thách" (hoặc breadcrumb nếu vào từ profile).
2. **Header**: challenge title + **verdict chip** (Đạt=success / Chưa đạt=danger / Đang chấm=muted) + **score** `0/100` + artifact "Xem bài nộp ↗" (`submissionUrl`) + meta (Lần thử N · processedAt).
3. **Attempt switcher** (rail trái hoặc strip): mỗi lần thử = score + trạng thái; chọn để xem; thấy trend.
4. **shortFeedback** (1 dòng tóm tắt) + đếm theo severity.
5. **Feedback gom theo severity** (Cao/TB/Thấp/Hoàn hảo): card = `message` (MarkdownContent) + `detail` + `location`→GitHub link + `suggestion` (code). Tái dùng nội dung `FeedbackCard` hiện có nhưng đặt trên trang.
6. **State**: loading=skeleton mirror (header + vài card) theo `/starci-fe-skeleton-apply`; empty="chưa có lần nộp nào" + CTA về nộp; error=retry. a11y: severity có text+icon, không chỉ màu.

## Cắt / Thêm / Giữ
- **Cắt:** `FeedbackDetailsModal` (modal lồng) + drawer→modal flow. (Giữ file tới khi apply xong.)
- **Thêm:** trang result; feedback gom theo severity; `detail`+`suggestion` đầy đủ; trend điểm; (sau) gộp milestone feedback cùng layout.
- **Giữ:** inline `LastAttemptResult` preview trong panel (CTA "Xem kết quả đầy đủ" → mở trang) — preview nhanh vẫn hữu ích.

## Hỏi thầy trước khi apply
- **Route đặt ở đâu:** (a) dưới challenge `…/challenges/<id>/result` (gần solve), hay (b) route dùng-chung `…/submissions/<attemptId>` để profile submissions/attempts cùng trỏ vào. Đề xuất (b) để 1 trang nuôi 3 lối vào.
- Có gộp luôn **milestone/personal-project feedback** vào cùng layout không (giảm 2→1 chỗ maintain), hay chỉ làm challenge trước.
