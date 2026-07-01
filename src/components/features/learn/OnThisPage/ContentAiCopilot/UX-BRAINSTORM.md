# UX-BRAINSTORM — `ContentAiCopilot` kiểu "khung chat" (2026-06-18)

> KHÔNG code — brainstorm + chốt. Vùng: panel **Hỏi StarCi AI** ở rail PHẢI bài học (`OnThisPage/ContentAiCopilot`).
> Thầy: *"làm kiểu khung chat được không?"* (thay one-shot hỏi→đáp hiện tại bằng hội thoại nhiều lượt).

## 0. Hiện trạng (inventory)
- `ContentAiCopilot` v1: **1 ô input + 1 answer** (answer mới ĐÈ answer cũ). Không lịch sử, không follow-up.
- BE `askContentAi` = **STATELESS**: mỗi lần = body bài + 1 câu hỏi → 1 đáp. **Không nhớ lượt trước.** Flat 1 credit/câu.
- Rail PHẢI = **w-64 (256px) HẸP** + `OnThisPage` tự ẩn khi bài 0 heading.

## 1. 2 vấn đề cốt lõi của "khung chat"
1. **CHỖ:** chat thread trong rail w-64 → bong bóng wrap 1–2 chữ/dòng, gõ chật → UX tệ. Chat cần BỀ NGANG.
2. **MEMORY = COST:** "chat thật" (follow-up "giải thích thêm", "ví dụ?") cần model THẤY lượt trước → BE phải gửi
   lịch sử hội thoại → **token tăng theo độ dài thread** → đắt dần, đụng mục tiêu cost-control (flat 1 credit, đáp ngắn).
   `askContentAi` hiện stateless → mỗi đáp độc lập, không nhớ.

## 2. Mục tiêu
Trợ giảng hỏi-đáp NGAY tại bài: hỏi → đáp ground theo bài → hỏi tiếp tự nhiên. Giữ rẻ + đúng surface StarCi.

## 3. Hướng
### Trục A — ĐẶT Ở ĐÂU
- **A1 — thread TRONG rail** (w-64): luôn-hiện, contextual; nhưng **chật**. Hợp thread ngắn 2–3 lượt.
- **A2 ✅ — CHAT trong DRAWER** (desktop `right` / mobile bottom-sheet), mở từ 1 entry gọn ở rail ("Hỏi StarCi AI").
  Đủ bề ngang, **giữ ngữ cảnh bài** (đúng `main.md` §6: Drawer = inspect/ongoing keep-context). Overlay store + DrawerContainer có sẵn.
- **A3 — route chat full-page:** mất ngữ cảnh đọc → loại.

### Trục B — MEMORY (cost)
- **B1 — STATELESS visual-thread (rẻ nhất, v1):** UI là thread (bong bóng Q/A chồng lên), NHƯNG mỗi câu vẫn gọi
  `askContentAi` độc lập (chỉ thấy body + câu đó, KHÔNG thấy lượt trước). Trông như chat, **0 BE đổi, 0 cost thêm**,
  flat 1 credit/câu. Hạn chế: follow-up "giải thích thêm" không có ngữ cảnh lượt trước.
- **B2 — MEMORY thật (v2, cost+):** BE nhận **last N lượt** (cap 3–4) + body 1 lần → model nhớ → follow-up đúng.
  Token tăng (bounded bởi cap). Vẫn 1 credit/câu (StarCi nuốt token bằng Economy + cap). Cần đổi `askContentAi`
  (nhận `messages[]`) hoặc mutation mới `chatContentAi`.

### Trục C — STREAM (polish)
- Non-stream (invoke hiện tại) = đáp hiện 1 cục. Stream (socket như AI Lab) = token chảy dần, "cảm giác chat" thật hơn.
  Tăng phức tạp (socket). **Để polish sau.**

## 4. CHỐT
- **A2 + B1 cho v1:** **Drawer chat** (đủ chỗ, mobile bottom-sheet) + **thread stateless** (rẻ, reuse `askContentAi`
  y nguyên, history chỉ ở client). Rail chỉ còn **entry gọn**: nút "Hỏi StarCi AI" (+ tuỳ chọn ô hỏi nhanh → mở drawer
  kèm câu đầu). → giải quyết CHỖ + giữ RẺ + đúng surface. Visual là khung chat thật.
- **B2 (memory) = v2** khi thầy chấp nhận cost follow-up: thêm `messages[]` (cap last N) vào BE. Trước đó B1 đủ cho
  hỏi-đáp đơn lẻ dạng thread.
- **Stream = v3** (polish).

→ Tức "khung chat" = **ĐƯỢC**, nên làm trong **Drawer** (không nhồi rail hẹp), bản đầu **không-nhớ** (rẻ), nhớ-lượt là bước cost sau.

## 5. IA Drawer chat (A2)
- **Trigger:** rail `ContentAiCopilot` co lại còn: icon Sparkle + "Hỏi StarCi AI về bài này" + (tuỳ) 1 ô hỏi nhanh →
  Enter/nút mở Drawer (seed câu đầu).
- **Drawer:** header "StarCi AI · {tên bài}"; **thread** (bong bóng: user phải/AI trái, AI dùng `MarkdownContent`);
  **composer** dưới (Input + gửi, `isPending`); chip "Còn N credit"/"Còn 2 lượt free" (khi có v2 counter);
  empty = vài **câu gợi ý** (FAQ sau) → bấm là hỏi; quota hết → CTA "Mở khóa / nâng gói AI".
- **State:** thread = client state (ephemeral v1) keyed theo contentId (đổi bài → thread mới/clear). Mỗi gửi = optimistic
  thêm bong bóng user + "đang trả lời…" → `askContentAi` → thêm bong bóng AI. Lỗi/quota = toast + bong bóng lỗi.
- Overlay qua **zustand store + `DrawerContainer`** (đúng rule §12, KHÔNG useState mở/đóng).

## 6. Section → dữ liệu / đừng-vỡ
| Phần | Nguồn | Ghi chú |
|---|---|---|
| Bong bóng AI | `askContentAi(contentId, question)` (stateless) | v1; v2 thêm `messages[]` |
| Credit còn | `myAiQuota.credit` | chip header drawer |
| Thread history | client state (ephemeral) | v1 KHÔNG persist; persist = bảng `content_ai_thread` (v3+) |
- **Đừng-vỡ:** v1 stateless → đừng hứa "nhớ lượt trước" (UI đừng gợi follow-up phụ thuộc ngữ cảnh). Mobile = bottom-sheet
  KHÔNG drawer-right. Đáp dài → drawer cuộn, rail không. Đổi bài giữa chừng → clear/đổi thread (tránh lẫn ngữ cảnh).

## 7. Cắt / Thêm
- **THÊM:** Drawer chat (overlay store) + thread bong bóng + composer; rail entry gọn mở drawer.
- **CẮT khỏi rail:** answer-đè-answer one-shot (chuyển vào drawer thread).
- **GIỮ rẻ:** v1 stateless (0 BE đổi). Memory/stream/persist = tăng dần khi thầy chốt cost.

→ Thầy duyệt **A2+B1** (Drawer chat, không-nhớ, rẻ) → `/ux-apply`. Muốn nhớ-lượt ngay (B2) thì trò thêm `messages[]` ở BE.

---

## > CHỐT 2026-06-18 — A2 (Drawer) + **B2 (CÓ MEMORY)** — thầy duyệt
Khung chat = **Drawer** (desktop right / mobile bottom-sheet), **nhớ lượt trước**. Lộ trình build:
1. **BE — đổi `askContentAi` nhận hội thoại:** thêm field `messages: [{ role, content }]` (hoặc field `history`) vào
   `AskContentAiRequest`. Handler: build messages = SystemMessage(body) + **last N lượt (cap 3–4)** + câu mới →
   `AiInvokeService.invoke`. Vẫn **flat 1 credit/câu** (StarCi nuốt token tăng bằng Economy + cap history). Cost tăng
   bounded bởi cap. (Giữ contentId để load body 1 lần.)
2. **FE — Drawer chat:** overlay store zustand (`useContentAiChatOverlayState`) + `DrawerContainer`; feature
   `ContentAiChat` (header tên bài + chip credit · thread bong bóng user/AI [AI=`MarkdownContent`] · composer Input+gửi
   `isPending`); rail `ContentAiCopilot` co còn nút mở drawer (+ô hỏi nhanh seed câu đầu). Thread = client state keyed
   theo contentId, gửi kèm **last N lượt** lên BE.
3. **State:** đổi bài → clear thread. Optimistic thêm bong bóng user + "đang trả lời…". Quota hết → CTA (v2 freemium).
- Cap history = **4 lượt gần nhất** (cân memory vs cost). Stream = v3 polish.
→ `/ux-apply`: BE messages[] trước, rồi FE Drawer chat.
