# Gợi ý cho StarCi — chắt từ 5 case ref (2026-06-18)

> Học từ `boot-dev / react-dev / stripe-docs / duolingo / mintlify`. Mỗi gợi ý: **từ ref nào → làm gì → tại sao →
> effort → grounded (data thật)**. Xếp theo ROI. Trang đọc bài đã polish (content-map + on-this-page + actions + FAB) —
> đây là lớp NEXT.

## 🟢 Quick wins (0–thấp effort, ROI cao)
1. **"Bạn sẽ nắm được" callout đầu bài** ⭐ *(react.dev `<YouWillLearn>`)*
   - StarCi **có field `outcomes` ở BE nhưng CHƯA expose FE** → cơ hội rõ nhất. Render 3–4 bullet ngay dưới mô tả bài.
   - Tại sao: đặt kỳ vọng → đọc có mục tiêu (80% khác biệt "chỉn chu"). Effort: nhỏ (BE thêm `outcomes` vào content GraphQL + FE bullet).
2. **Hẹp cột đọc 1024 → ~720–768px** *(react.dev/Stripe đều ~600–800)*
   - Dòng dài 1024px khó quét. Effort: 1 dòng `max-w`. Grounded: pure CSS.
3. **Suggested questions trong chat AI (empty-state)** *(Mintlify)*
   - ContentAiChat khi trống → 3–4 câu gợi ý bấm-là-hỏi (tạm hardcode theo loại bài; sau = FAQ pre-baked).
   - Tại sao: giảm free-form (rẻ token) + mồi. Khớp plan FAQ pre-baked đã có.
4. **Microcopy động-từ + "tại sao"** *(Stripe)*
   - Nút/label generic → động từ hành động + lý do ("Làm thử thách để áp dụng", không chỉ "Thử thách"). Effort: i18n.
5. **Mascot ngọn lửa XUYÊN SUỐT** *(Duolingo Duo)*
   - Đang làm mascot cho FAB → tái dùng ở **empty-state, loading, dashboard, lên-level** (không chỉ FAB). Nhân-hoá thương hiệu.

## 🟡 Medium (giá trị thật, vừa sức)
6. **Path-map trực quan trang Chỉ mục** *(Duolingo path)*
   - Bổ sung accordion bằng **chuỗi chấm tuần tự**: đã-xong (✓) / đang (pulse) / khoá → cảm giác "leo đường". `myCourseOutline` đã đủ data.
7. **AI Socratic "tutor mode"** *(boot.dev Boots)*
   - `askContentAi` thêm chế độ **gợi mở, KHÔNG cho đáp án thẳng** (nhất là khi hỏi về challenge) → học thật, đỡ "chép". 1 dòng system prompt + toggle.
8. **AI citation đoạn bài** *(Mintlify)*
   - Câu trả lời kèm anchor "📍 mục 2.1" → click cuộn tới chỗ trong bài (StarCi đã có heading id + scroll). Tăng tin cậy.

## 🔵 Strategic (landing / funnel / positioning)
9. **Landing kiểu boot.dev** *(boot.dev + Mintlify)*
   - **Logo-wall cty học viên · "X học viên" · lương "$Y/năm" ROI · "thoát tutorial hell" · Wall of Love (testimonial avatar+rating)**. StarCi có `platformStats` + headhunting/CV → ráp được proof thật.
10. **AI = "guided conversation" làm điểm BÁN** *(Mintlify)*
    - Marketing trợ giảng AI như lý do mua (không chỉ tính năng). Khớp model "AI bán khóa" thầy chốt.
11. **Tie học → việc rõ hơn** *(boot.dev career-outcome)*
    - StarCi có headhunting + CV review → nối "học xong → CV → việc/lương" thành funnel kết quả (boot.dev neo ROI bằng lương).
12. **Community social proof** *(boot.dev "33.7M lessons completed")*
    - `platformStats` (đã có) → hiện "X bài đã hoàn thành / Y học viên" ở landing + dashboard.

## Bảng ưu tiên đề xuất
| # | Gợi ý | ROI | Effort | Cần BE? |
|---|---|---|---|---|
| 1 | outcomes "Bạn sẽ nắm được" | ⭐⭐⭐ | nhỏ | có (expose field) |
| 3 | suggested Q chat | ⭐⭐ | nhỏ | sau (FAQ) |
| 2 | hẹp cột đọc | ⭐⭐ | tí | không |
| 6 | path-map Chỉ mục | ⭐⭐ | vừa | không |
| 7 | AI Socratic mode | ⭐⭐ | nhỏ | có (prompt) |
| 9 | landing proof | ⭐⭐⭐ | vừa | một phần (có platformStats) |

→ Đề xuất làm trước: **#1 (outcomes) + #2 (cột đọc) + #3 (suggested Q)** — nhỏ, grounded, nâng trải nghiệm đọc ngay.
