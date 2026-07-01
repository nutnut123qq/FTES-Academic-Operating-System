# Mintlify — AI-native docs (AI assistant trong docs)

> Sản phẩm docs gắn AI. Pull 2026-06-18 (homepage marketing — UX AI thật xem ở docs.* của khách Mintlify).
> Tham khảo cho **trợ lý AI + đọc bài** StarCi.

## Pattern lấy được
- **AI = "guided conversation"**: định vị AI biến mỗi lần đọc docs thành **hội thoại có dẫn dắt** ("Turn every doc visit
  into a guided conversation") — AI là công cụ chuyển đổi, không chỉ tiện ích.
- **Ask AI in-context**: entry "Ask AI" ngay trong docs (header/search) → chat hiểu ngữ cảnh trang đang đọc.
- **llms.txt + MCP**: expose nội dung cho AI workflow ngoài (visibility trong ChatGPT/Claude).
- **Modular component docs**: thư viện component (callout/card/tabs/accordion) cho layout linh hoạt.
- **Nav tách rõ**: Getting Started · Components · API Reference · Changelog.
- **Trust/feedback**: SOC2/ISO; **"Wall of Love"** social proof; customer stories.
- **Onboarding**: "Deploy in minutes / Quickstart"; free trial + contact sales.

> Pattern AI-docs điển hình (Mintlify/khách + chuẩn ngành) để soi tiếp:
> - **"Ask AI" search bar** (Cmd+K) trả lời + **trích nguồn đoạn docs** (citation link tới section).
> - **Suggested questions** (3–4 câu gợi ý) khi mở chat (giảm free-form, rẻ).
> - **"Was this page helpful? 👍/👎"** cuối trang (feedback loop).

## → Áp cho StarCi
- **AI = guided conversation** = đúng hướng FAB chat StarCi (ground theo body bài). Mintlify validate.
- **Suggested questions khi mở chat** → khớp plan StarCi "FAQ pre-baked" (rẻ, mồi) — ĐƯA vào empty-state của ContentAiChat.
- **Citation đoạn bài**: nâng cấp `askContentAi` (v3): trả kèm anchor/đoạn nguồn → click cuộn tới chỗ trong bài.
- **llms.txt**: StarCi đã có sitemap/robots → cân nhắc thêm `llms.txt` cho content public (AI-SEO, dài hạn).
- **"Was this helpful?"**: StarCi từng có (thầy gỡ vì vanity) — Mintlify giữ; nếu nối BE feedback thật thì đáng làm lại.
- **Wall of Love + Quickstart**: cho landing StarCi.
