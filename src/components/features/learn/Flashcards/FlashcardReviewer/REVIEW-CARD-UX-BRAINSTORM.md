# UX Brainstorm — Màn ôn thẻ (flip card review session)

> `/starci-fe-ux-brainstorm` · 2026-06-25 · `/learn/flashcards` → Học thẻ → ôn 1 deck (`FlashcardReviewer`) + due session (`DueReview`), cùng dùng block `FlipCard`. Thầy: *"render lại cho đẹp"*. KHÔNG code — chốt hướng rồi `/starci-fe-ux-apply`.

## Bệnh (vì sao xấu) — ROOT CAUSE
`FlipCard` (block) xếp **CẢ 2 face vào CÙNG 1 grid cell** (`gridArea: 1/1`) → card cao = **max(front, back)**. Face "Câu hỏi" thường NGẮN, face "Đáp án" là markdown **dài + code** → câu hỏi ngắn bị nhét vào card cao bằng câu trả lời dài → **trống hoác**. `FACE_CLASS = min-h-64 ... bg-default/40 p-8` + `mt-auto` đẩy hint "Bấm để lật" xuống tận đáy → khoảng trắng khổng lồ giữa câu hỏi và hint.
- Phụ: fill `bg-default/40` nhạt nhoà (không ra "thẻ"); nội dung căn TRÁI-TRÊN (không căn giữa) → câu hỏi ngắn trôi nổi góc trên; "Câu hỏi" label nhỏ, không phân cấp; affordance lật mờ.

## Mục tiêu màn (≤5s)
Học viên thấy NGAY **1 câu hỏi rõ ràng, cân đối** + biết **lật cách nào** + **lật xong chấm recall**. Card phải **vừa nội dung** (ngắn không trống, dài cuộn được), đọc như 1 thẻ thật.

## Data THẬT (đã research BE/DB phần trước — đủ, không query mới)
| Phần | Field |
|---|---|
| Câu hỏi (front) | `card.question` (markdown) |
| Đáp án (back) | `card.answer` (markdown, có thể null) |
| Chiều sâu | `card.explanation` (markdown, optional) |
| Meta thẻ | `card.level` (junior/middle/senior/staff) · `card.tags[]` |
| Tiến độ | `currentIndex/cards.length` ("Thẻ 1/10") |
| Chấm SM-2 | 4 grade (Again/Hard/Good/Easy) · `nextIntervals` preview (đang CHƯA hiện) |
| Premium lock | `card.isPremium` + `enrolled` → giấu đáp án |
| Liên quan | `deck.contents[]` (deep-link bài) |
- **Field chưa dùng = cơ hội:** `nextIntervals.{again,hard,good,easy}` (số ngày tới hạn theo từng grade) — hiện ở `DueReview` (RatingBar có hint) nhưng `FlashcardReviewer` bỏ → nên hiện "+4 ngày" trên nút grade.

## Ref (web + domain)
- **Quizlet study mode** — card lớn căn GIỮA, tap-to-flip, progress "x/y" + thanh, prev/next. → card centered + affordance rõ.
- **Anki review** — câu hỏi giữa + "Show Answer" → hiện grade buttons (Again/Hard/Good/Easy có interval preview). → reveal-rồi-grade, hiện interval.
- **Memoa thesis / memo.cards** — flashcard mobile: CTA front-and-center, nav ngắn gọn. ([theseus.fi thesis](https://www.theseus.fi/bitstream/handle/10024/496733/Bao%20Ho%20-%20Thesis.pdf), [memo.cards](https://www.memo.cards/blog/how-to-customize-anki-s-user-interface))
- Rules nội bộ: [[reading-markdown-in-paper-card]] (markdown đọc nằm trong paper card) · [[item-card-meta-inside-bounded-object]] · card global = border + no shadow.

## 3 hướng (xem widget)
### Hướng A — Centered study card (Quizlet) ✦ ĐỀ XUẤT
- **Card chiều cao CỐ ĐỊNH thoải mái** (vd `h-80`/`min-h-72 max-h-[28rem]`), **câu hỏi căn GIỮA** (dọc+ngang) → ngắn cũng cân, KHÔNG trống. Đáp án dài → **cuộn trong card** (`overflow-y-auto`, ScrollShadow). Giữ flip 3D (2 face cùng chiều cao cố định → hết jump/max-bug).
- Header: thanh progress mảnh + "Thẻ 1/10" + chips level/tag (1 hàng quiet). Affordance "Nhấn để lật đáp án" = **pill giữa đáy** (rõ, không mờ). Footer: Trước (ghost) · Xem đáp án (primary). Reveal → đáp án căn TRÁI (markdown/code) + grade bar (kèm interval preview).
- **Chốt vì**: fix đúng root-cause (cố định chiều cao + center) mà GIỮ bản sắc flashcard (lật). Đẹp + cân + quen thuộc (Quizlet). 0 query mới.
- Trade-off: đáp án rất dài phải cuộn trong card (chấp nhận; hoặc max-h cao hơn).

### Hướng B — Reading sheet (đáp án bung tại chỗ, BỎ flip 3D)
- Bỏ lật 3D → "Xem đáp án" bung đáp án NGAY DƯỚI câu hỏi trên cùng 1 paper card (cross-fade/expand). **Hợp nhất cho Q&A kỹ thuật nhiều code** (lật 3D khối code cao rất kỳ). Đọc liền mạch câu hỏi→đáp án.
- Trade-off: mất "cảm giác thẻ" (flip vui). Nhưng nội dung THỰC TẾ ở đây = phỏng vấn dài + code → readability thắng. Ref [[reading-markdown-in-paper-card]].

### Hướng C — Minimal focus
- Lột chrome: chỉ câu hỏi giữa khổ lớn + 1 CTA "Xem đáp án"; progress mảnh trên; prev ẩn nhỏ. Tập trung tối đa.
- Trade-off: meta (level/tag) + liên quan bị giấu → mất context; hơi trống với màn rộng desktop.

## Đề xuất chốt
**A** (centered study card) — fix gốc + giữ flashcard feel + đẹp/quen. **NHƯNG** nội dung ở đây là phỏng vấn dài-có-code → nếu thầy ưu tiên ĐỌC đáp án hơn cảm-giác-lật thì **B** thắng. → em nghiêng **A cho mặc định, mở đường B** (có thể A cho card ngắn, expand cho đáp án dài). Thầy chọn.

## States (mọi hướng)
- **Card sizing**: cố định chiều cao + center front; back cuộn nếu dài (KHÔNG để max-of-both gây trống).
- **Premium lock**: giữ (LockIcon + CTA enrol thay đáp án).
- **Empty/done**: `EmptyState` "xong phiên" giữ. Loading skeleton mirror chiều cao card mới (không phải min-h-64 cũ).
- **a11y**: flip `role=button` + aria; grade buttons label rõ; interval preview đọc được.

## Sau khi thầy duyệt
`/starci-fe-ux-apply`: sửa block `FlipCard` (cố định chiều cao + center + cuộn back + affordance pill + da card border) HOẶC tách `ReviewCard` mới; áp cho cả `FlashcardReviewer` + `DueReview`; hiện `nextIntervals` trên grade; skeleton mirror. Rút nguyên tắc ("flip/2-face card phải cố định chiều cao, đừng size theo max-of-both") → `.claude/rules/drafts/`.
