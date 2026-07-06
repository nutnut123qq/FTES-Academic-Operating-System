# Proposal — faq-show-more

## Why

Checklist STT 27: FAQ landing đang xổ hết tất cả câu; user muốn mặc định chỉ hiện
tượng trưng 5-6 câu + nút "show more" bấm để hiện đầy đủ (khi bộ câu hỏi được bổ sung
nhiều hơn).

## What Changes

- **`FaqSection`:** mặc định render `FAQ_VISIBLE` (5) câu đầu; nếu còn nhiều hơn thì
  hiện nút toggle "Xem thêm câu hỏi" / "Thu gọn" (caret up/down) xổ full / thu lại.
- i18n: `homeLanding.faq.showMore` + `homeLanding.faq.showLess` (vi/en).

## Capabilities

### Modified Capabilities

- `home-landing`: FAQ hiển thị rút gọn mặc định + show-more toggle, sẵn cho việc
  thêm câu hỏi. Mọi Q&A vẫn nằm trong DOM khi mở (crawlable như trước).

## Impact

- FE-only, 1 component (`FaqSection`) + 2 i18n key. Không BE, không dependency.
