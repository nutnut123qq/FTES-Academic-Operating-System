# UX Brainstorm — panel chat Content-AI (`ContentAiChat`)

> Re-imagine bố cục panel "Hỏi StarCi AI" (popover/drawer FAB nổi trên trang đọc/giải challenge).
> Ngày 2026-06-28. Hướng thầy chốt trước: dời toolbar model/settings xuống đáy + "Xoá lịch sử" → settings-link→modal.

## Mục tiêu panel (≤2s)
1 việc chính: **gõ câu hỏi về bài → đọc câu trả lời** (thread). Mọi thứ khác (chọn model, xoá lịch sử) là **phụ** → không được tranh chỗ với composer/thread.

## Dữ liệu THẬT (đã có, không bịa)
- Thread: stream qua socket `content_ai` bằng **qwen local (Free, 0 credit)**.
- Lịch sử: lưu DB `(enrollment_id, content_id)` → query `contentAiHistory` (load) + mutation `clearContentAiHistory` (clear).
- Model picker: `aiModels.gradableModels` lọc `category=Free` (hiện chỉ qwen). Là **scaffold** — sẵn sàng khi có thêm model local.

## Pain hiện tại
- Hàng toolbar (model picker + "Xoá lịch sử") nằm **TRÊN cùng** → đẩy thread xuống, "Xoá lịch sử" là **nút trần ngay cạnh model** (1 thao tác phá huỷ phơi sỗ sàng, dễ bấm nhầm; vi phạm convention "data-deletion thuộc settings").
- 2 control phụ chiếm 1 hàng đầu panel nhỏ → loãng, kém tập trung vào thread.

## Ref (web, 2026)
- **Model picker ở đáy/trong composer = pattern chuẩn** (Claude.ai, Perplexity, Vercel AI Elements `Model Selector`, OpenAI ChatKit composer-bar actions) — model selector là "composer-region control", đặt header HOẶC toolbar đáy đều hợp lệ. ([AI Elements](https://elements.ai-sdk.dev/) · [Setproduct: AI chat anatomy](https://www.setproduct.com/blog/ai-chat-interface-ui-design) · [MUI X Chat Composer](https://mui.com/x/react-chat/material/composer/))
- **Xoá hội thoại = privacy/data-control → thuộc settings (gear), không phải nút trần** ([UXPin chat UI](https://www.uxpin.com/studio/blog/chat-user-interface-design/) · [aiuxdesign conversational patterns](https://www.aiuxdesign.guide/patterns/conversational-ui)).
→ Hướng thầy (toolbar đáy + clear-vào-settings) **đúng chuẩn ngành**.

## IA mới
`[header mảnh] · [thread = primary, fill] · [composer] · [toolbar đáy: model trái · ⚙ Cài đặt phải]`. Settings (⚙) → **modal** chứa: (1) model trả lời (read/pick), (2) "Xoá lịch sử chat" (danger, có mô tả).

## 3 hướng (widget mockup)
- **A — Toolbar DƯỚI composer** ⭐ *(đề xuất — đúng mũi tên thầy vẽ)*: thread → composer (input+gửi) → 1 hàng footer `[✨ qwen · Miễn phí ▾]  …  [⚙ Cài đặt]`. Composer sạch, control phụ tách hẳn xuống chân. Rõ ràng, dễ áp, khớp ý thầy.
- **B — Toolbar TRONG composer** (chuẩn Claude.ai/Perplexity): model + ⚙ nằm hàng dưới BÊN TRONG khung composer (cạnh nút gửi). Gọn nhất (không thêm hàng), nhưng nhồi 3 thứ (model/⚙/gửi) vào 1 dòng hẹp → panel nhỏ dễ chật.
- **C — Chỉ ⚙ (header)**: composer trơ; model hiện caption muted "Trả lời bởi qwen · Miễn phí"; chọn model + xoá đều trong modal. Tối giản nhất nhưng "chọn model" bị giấu sâu (chỉ hợp khi model gần như cố định — đúng hiện trạng 1 model, nhưng mất tính "chọn được").

## Chốt: **Hướng A**
Khớp đúng ý thầy (toolbar đáy), đúng ref ngành, giữ model-pick hiển thị (1 chạm) + đẩy "Xoá lịch sử" vào modal (an toàn, đúng convention privacy). B/C để dành nếu sau muốn nén thêm.

## Section → control → data
| Vùng | Control | Nguồn |
|---|---|---|
| Thread | bubble user/assistant | socket `content_ai` (qwen Free) + hydrate `contentAiHistory` |
| Composer | input + Gửi | emit `AskContentAi` (stream) |
| Toolbar đáy | model picker | `aiModels.gradableModels` (Free) |
| Toolbar đáy | ⚙ Cài đặt → modal | mở modal (zustand overlay) |
| Modal | model trả lời | như trên |
| Modal | Xoá lịch sử chat (danger) | mutation `clearContentAiHistory` |

## State / a11y
- Empty thread: hint + suggestion chips (giữ như hiện tại).
- Modal: nút "Xoá" = `variant` danger; mô tả rõ "xoá hội thoại của BÀI NÀY" (scope per-content). Cân nhắc confirm 1 bước (modal đã là 1 bước → đủ).
- ⚙ icon-only cần `aria-label="Cài đặt"`; model picker giữ `aria-label`.

## Cắt / thêm
- **Cắt**: nút "Xoá lịch sử" trần khỏi toolbar (→ vào modal).
- **Dời**: toolbar model từ TRÊN → DƯỚI.
- **Thêm**: `⚙ Cài đặt` link + modal Cài đặt (block modal HeroUI + overlay store). Không thêm BE (query/mutation đã có).

→ Thầy chọn hướng (A đề xuất) → `/starci-fe-ux-apply` để dựng.
