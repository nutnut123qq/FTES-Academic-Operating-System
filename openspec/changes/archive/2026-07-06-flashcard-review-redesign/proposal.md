# Proposal — flashcard-review-redesign

## Why

Checklist STT 29D: UI flashcard hiện còn thô (1 thẻ flip term/định-nghĩa + prev/next +
restart/regenerate). Ảnh output mong muốn (image40/image7 — StarCi "Ôn tập"): có
progress "Thẻ i/total" + thanh, thẻ lớn hỏi/đáp rõ, và **hàng tự đánh giá spaced-
repetition** (Quên / Khó / Được / Dễ kèm mốc ôn lại) để đẩy sang thẻ kế.

## What Changes

- **`SubjectAiFlashcards`:** dựng lại phần review:
  - Header progress: `cardProgress` ("Thẻ i/total") + `ProgressMeter` (index/total).
  - Thẻ flip lớn hơn (`min-h-64 rounded-3xl bg-surface`), nhãn front/back đổi màu,
    gợi ý "Xem đáp án" khi chưa lật.
  - Khi đã lật → hàng **4 nút tự đánh giá** (Quên/Khó/Được/Dễ, tone danger/warning/
    accent/success + mốc <1 phút / 1 ngày / 3 ngày / 5 ngày) → chấm = sang thẻ kế;
    thẻ cuối → trạng thái hoàn thành. Khi chưa lật vẫn có prev/next.
  - Trạng thái hoàn thành: "Đã ôn xong N thẻ" + Ôn lại / Tạo lại.
- i18n: thêm `cardProgress`, `showAnswer`, `selfRatePrompt`, `rating.*`, `interval.*`,
  `reviewDone`, `reviewDoneHint` (vi/en). Rating KHÔNG lưu (chưa có BE) — ghi giả định.

## Capabilities

### Modified Capabilities

- `subject-ai-flashcards`: chế độ ôn tập kiểu spaced-repetition (self-rate) + progress,
  thay cho deck flip trơn. FE-only, mock (không đổi thuật toán lịch ôn ở BE).

## Impact

- FE-only. 1 component + 2 i18n. Không BE, không dependency. "Hỏi nhanh"/interview mode
  (segmented toggle trong ảnh) là tool riêng — ngoài phạm vi, ghi follow-up.
