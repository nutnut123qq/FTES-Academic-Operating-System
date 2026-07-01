# Learn right-rail — UX Brainstorm

> Trang: khu đọc bài `/[locale]/courses/[courseId]/learn/modules/[moduleId]/contents/[contentId]`
> Vùng: **rail PHẢI** (`features/learn/OnThisPage`, slot `LearnShell.rightRail`).
> Ngày: 2026-06-18 · `/ux-brainstorm` → đã `/ux-apply`. KHÔNG fake data.

## 0. Bối cảnh
Thầy chốt **bỏ widget "Trang này có hữu ích không? 👍👎"** (pattern docs-site generic + vote giả, chỉ
`useState` không lưu BE → vanity; xem draft `no-generic-docs-site-patterns.md`). Sau khi bỏ, rail phải chỉ còn
**mục lục heading (OnThisPage TOC)** + một vùng TRỐNG bên dưới (thầy khoanh đỏ). Câu hỏi: lấp gì cho ĐÚNG?

## 1. Mục tiêu (≤30s)
Người đọc vừa học xong một bài. Rail phải = **định hướng + hành động kế tiếp NGAY tại ngữ cảnh bài này**.
Vòng học chuẩn: **đọc → ôn (flashcard) → luyện (challenge)**. Rail nên đóng vòng đó, KHÔNG nhồi thứ generic.

## 2. Dữ liệu THẬT khả dụng (grounded — bám contentId)
| Nguồn | Query | Bám bài? | FE wrapper | Ghi chú |
|---|---|---|---|---|
| 🔥 Flashcards của bài | `flashcardDecksByCourse(courseId, **contentId**)` | ✅ M2M `flashcard_deck_contents` | ✅ `query-flashcard-decks-by-course.ts` (đã nhận contentId) | sạch, KHÔNG coupling |
| Challenges của bài | `challenges({ contentId })` | ✅ | ⚠️ hook `useQueryChallengesSwr` **couple chặt**: chỉ fetch khi tab Challenges active + ghi redux | rail cần SWR riêng → tăng rủi ro |
| Next/Prev bài | suy từ `myCourseOutline` | ✅ | ✅ | **ĐÃ có `LessonPager`** trong content header → KHÔNG nhân đôi |
| Mark read / favorite | `contentStatus` + mutations | ✅ | ✅ | thuộc content header, không phải rail |
| Comments/reactions, trending | nhiều | một phần | một phần | generic/social → KHÔNG hợp rail đọc |

## 3. Hướng
- **A ✅ CHỐT — "Ôn lại bài này" (Flashcards theo contentId):** dưới TOC thêm panel liệt kê bộ thẻ gắn với bài +
  CTA "Ôn tập" → trang Flashcards. Bám đúng bài, **synergy** với feature Flashcards (SM-2) vừa dựng, dùng API sạch
  (chỉ thêm `contentId`), **0 coupling**, tự ẩn khi bài không gắn deck. Rủi ro thấp.
- B — Thêm cả "Luyện tập" (challenges theo bài): giá trị cao (đóng nốt vòng read→solve) nhưng hook challenges
  couple chặt (tab + redux) → rail phải tự viết SWR riêng + gating enroll → churn/rủi ro hơn. **Để increment sau.**
- C — Panel social (comments/reactions/trending) ở rail: lệch mục tiêu "đọc"; loãng như docs-site. Bỏ.

→ **CHỐT A** (challenges = follow-up). Lý do: ship gọn, rủi ro thấp, nối thẳng vào Flashcards vừa làm; vùng trống
được lấp bằng thứ THỰC SỰ thuộc về bài đang đọc.

## 4. IA mới rail phải
`OnThisPage` (rail container, sticky w-64, tự ẩn khi 0 heading) bên trong:
1. **TOC "Trên trang này"** (giữ nguyên: heading + scroll-spy + jump).
2. **`LessonFlashcards`** (mới, child, tự fetch + tự ẩn): `Separator` + Label "Ôn lại bài này" (icon `CardsThree`)
   + danh sách title bộ thẻ (truncate) + dòng "N bộ · M thẻ" + **1 primary CTA "Ôn tập"** → route flashcards.

## 5. Section → dữ liệu
| Section | Nguồn | State |
|---|---|---|
| TOC | `useTableOfContents(contentId)` (DOM) | tự ẩn 0 heading |
| LessonFlashcards | `flashcardDecksByCourse(courseId, contentId)` qua SWR | AsyncContent: loading=skeleton mirror · empty=**tự ẩn** (no emptyContent) · error=tự ẩn (read, không retry ồn) |

## 6. Cắt / Thêm / Giới hạn
- **THÊM:** panel Flashcards-của-bài (1 child feature self-contained).
- **CẮT:** widget helpful (đã xong).
- **KHÔNG nhân đôi** next/prev (đã có LessonPager) / mark-read (content header).
- **Giới hạn đã biết (đừng fake):**
  - Rail tự ẩn khi bài **0 heading** → panel flashcards cũng ẩn theo (hiếm; bài các khóa này đều có `##`). Nếu sau
    này cần hiện trên bài heading-less → tách rail container riêng quyết visibility (increment).
  - **Chưa deep-link tới 1 deck cụ thể** (trang Flashcards chọn deck bằng state, KHÔNG có URL param deckId) → CTA
    đưa tới trang Flashcards, chưa mở thẳng deck. Muốn mở thẳng cần thêm `?deck=` ở route flashcards (BE/route work).
  - Panel chỉ hiện khi bài **được gắn deck** qua `flashcard_deck_contents` (seed M2M). Chưa gắn → tự ẩn (đúng, không bịa).
- **Follow-up:** "Luyện tập bài này" (challenges) — cần SWR rail riêng (hook hiện couple tab+redux).

---

## ROUND 2 (2026-06-18) — lấp NỐT "red box" + đóng vòng học + phễu freemium
> Thầy khoanh ĐỎ lại vùng dưới rail phải. `LessonFlashcards` (Hướng A) **tự ẩn khi bài không gắn deck** → nhiều bài
> red box vẫn TRỐNG. Cần neo bằng thứ **reliably-present** + đúng lúc "vừa đọc xong".

### Bối cảnh mới (thầy chốt gần đây)
- **Freemium:** free đọc + **kiếm XP từ đọc** (sunk cost) → leaderboard; **challenges/project = paid** (`isPurchased`).
- **"Kéo xuống hết = đã đọc"** (auto mark-read qua sentinel `useAutoMarkContentRead`) — đã có. Red box xuất hiện đúng
  lúc người đọc CHẠM ĐÁY bài = thời điểm vàng để gợi "bước tiếp theo".

### Dữ liệu reliably-present ở cuối bài
| Nguồn | Bám bài | Độ phủ | Ghi chú |
|---|---|---|---|
| 🔥 **Challenges của bài** `challenges({contentId})` | ✅ | **CAO** (đa số bài 2–4 thử thách) | hook couple tab+redux → rail cần SWR riêng |
| Outcomes "bạn sẽ nắm được" (`content.outcomes`) | ✅ | cao (đã wire outcomes 87 lesson) | content thuần, củng cố |
| Flashcards (Hướng A) | ✅ | THẤP (chỉ bài gắn deck) | đã có, tự ẩn |
| Progress/XP (myCourseOutline + xp) | ✅ | cao | dễ thành vanity nếu trùng chip "Nội dung N/M" |

### Hướng (red box)
- **R-A ✅ CHỐT — "Luyện tập bài này" (challenges panel) + gate freemium.** Dưới TOC/flashcards: list thử thách của
  bài + **1 primary CTA**. Reliably-present (đa số bài có challenge) → red box hết trống. **Đóng vòng read→review→
  practice** + **đòn bẩy phễu**: free (sunk cost vừa đọc xong + đã có XP) thấy panel khoá → CTA *"Mở khóa thực hành"*
  → convert; paid → *"Làm thử thách"*. Đúng chỗ, đúng lúc (chạm đáy). Cost: SWR rail riêng (hook couple) + map gate
  `isPurchased` (khi freemium land; giờ enrolled → mở thẳng).
- **R-B — "Bạn sẽ nắm được" (outcomes)** ngắn 3–4 gạch đầu dòng. Reliably-present, rủi ro ~0, củng cố học. Hợp làm
  **lớp đệm** đặt TRÊN challenges (đọc xong → "đã nắm gì" → "luyện ngay"). Có thể ghép cùng R-A.
- **R-C — Progress/sunk-cost nudge** ("đã đọc X% · +Y XP · còn N bài · mở thực hành"). Đúng tinh thần freemium nhưng
  dễ trùng `LessonPager` + chip vị trí + dễ vanity. Để CTA freemium **sống TRONG panel challenges** (R-A) thay vì 1
  widget riêng. Bỏ widget rời.

→ **CHỐT R-A** (challenges panel, reliably fills red box + đòn bẩy phễu), **+ R-B optional** (outcomes làm lớp đệm
trên). Vòng rail phải hoàn chỉnh: **TOC → (Bạn sẽ nắm được) → Ôn lại (flashcards, tự ẩn) → Luyện tập (challenges)**.

### IA rail phải (sau R-A)
1. **TOC** "Trên trang này" (giữ).
2. **(opt) LessonOutcomes** — "Bạn sẽ nắm được" (3–4 bullet từ `content.outcomes`), tự ẩn nếu trống.
3. **LessonFlashcards** — "Ôn lại bài này" (đã có, tự ẩn).
4. **LessonChallenges** (MỚI) — "Luyện tập bài này": list thử thách + meta (độ khó/điểm) + **CTA primary**
   ("Làm thử thách" | freemium-locked → "Mở khóa thực hành"). SWR riêng `challenges({contentId})`, AsyncContent
   (loading skeleton · empty=tự ẩn · error=tự ẩn). Tự ẩn khi bài 0 challenge.

### Section → dữ liệu / state
| Section | Nguồn | State |
|---|---|---|
| LessonChallenges | `challenges({ contentId })` (SWR rail riêng, KHÔNG dùng hook tab-coupled) | AsyncContent: skeleton mirror · empty→ẩn · error→ẩn |
| (opt) LessonOutcomes | `content.outcomes` (redux content) | ẩn nếu rỗng |
| CTA gate | freemium `isPurchased` (chưa land) → giờ luôn "Làm thử thách"; sau gate locked→"Mở khóa thực hành" | — |

### Đừng-vỡ
- **KHÔNG reuse `useQueryChallengesSwr`** (couple tab Challenges + ghi redux → đổi tab/nhiễu). Viết SWR rail riêng đọc-only.
- CTA "Làm thử thách" → mở tab Challenges của bài (route `?tab=challenges`) hoặc challenge route; KHÔNG nhân đôi nội dung challenge ở rail (chỉ teaser + CTA).
- Gate freemium chỉ bật khi `isPurchased` có thật — **đừng fake khoá** lúc chưa có field.
- Rail vẫn tự ẩn khi bài 0 heading (giới hạn cũ) → cân nhắc tách visibility rail khỏi TOC nếu muốn challenges hiện trên bài heading-less (increment).

---

## ROUND 3 (2026-06-18) — "nội dung bên phải" cho ĐỦ ĐẦY (red box vẫn cao+trống)
> Thầy soi bài "REST semantics": TOC ngắn (6 mục) → **red box dưới RẤT CAO + trống**. Flashcards tự ẩn (0 deck),
> Challenges (R-A) vừa dựng. Câu hỏi gốc: **nội dung nào XỨNG đặt bên phải để rail vừa đầy vừa giá trị, KHÔNG vanity?**

### Grounding (đừng fake — đã verify)
- ✅ `challenges({contentId})` — có (đã dựng `LessonChallenges`). Bài này header ghi **"2 thử thách"** → panel PHẢI
  hiện; chưa thấy = **BUG rail** (SWR pageNumber/header), KHÔNG phải thiếu ý tưởng → kiểm trước.
- ✅ `flashcardDecksByCourse(courseId, contentId)` — có (tự ẩn 0 deck).
- ❌ **`outcomes`/"bạn sẽ nắm được" KHÔNG có trên FE `ContentEntity`** (BE từng thêm, chưa expose FE) → **R-B BỎ**,
  đừng đề xuất làm anchor trừ khi expose field (GraphQL work).
- ❌ **AI hỏi-đáp theo bài: chưa có endpoint** (chỉ `aiLabPlayground` = eval-challenge). Cần BE mới — nhưng infra
  RAG (Qdrant) + ai-router ĐÃ có → khả thi.

### Vấn đề thật = mọi panel SELF-HIDE → red box trống
2 lối: **(a)** chấp nhận rail co ngắn (chuẩn docs — Stripe/Mintlify rail nhiều khi chỉ TOC; "red box" chỉ là
whitespace, không phải lỗi), chỉ cần Challenges hiện reliably; **(b)** thêm 1 ANCHOR luôn-hiện giá trị cao.

### Hướng
- **D1 ✅ SHIP-NOW (0 BE) — fix loop cho RELIABLE.** TOC → Flashcards(ẩn) → **Challenges**. **Việc: fix
  `LessonChallenges` hiện đúng** (bài có 2 thử thách mà trống = bug SWR). Bài có challenge → rail đầy; bài trơ → rail
  ngắn (chấp nhận).
- **D2 ⭐ NORTH-STAR (cần BE) — "Hỏi StarCi AI về bài này" (AI co-pilot rail).** Hero = ô hỏi AI, **RAG trên body bài**
  đang đọc. **LUÔN-HIỆN**, giá trị cao nhất (kẹt → hỏi ngay), đúng DNA StarCi (AI-assisted) — biến rail từ "docs TOC"
  thành "trợ giảng". Cần endpoint `askLessonAi(contentId, question)`; infra RAG + router có sẵn. = câu trả lời ĐÚNG
  nhất cho "nội dung bên phải".
- **D3 — Bridge rẻ: nút "Hỏi AI" → mở StarCi AI seed ngữ cảnh bài.** Ít BE, luôn-hiện, cầu nối tới D2.
- **D4 — Nudge funnel** (đã đọc X%/+XP/mở thực hành): trùng header (Đã đọc·Nội dung 10/95) + vanity → để CTA freemium
  sống TRONG Challenges (R-A), bỏ widget rời.

### CHỐT
- **NGAY:** D1 — **kiểm + fix `LessonChallenges`** (bài này CÓ 2 thử thách → phải hiện). Đó là cái lấp red box hôm
  nay, grounded, 0 BE.
- **KẾ (đề xuất mạnh):** **D2 — AI co-pilot rail** = nội dung XỨNG nhất bên phải (luôn-hiện + khác biệt + đúng StarCi).
  Cần BE `askLessonAi`; D3 (nút bridge) ship trước nếu muốn nhanh.
- **KHÔNG:** outcomes (chưa expose FE) · nudge rời (vanity).

### IA rail phải (đề xuất)
TOC → **(D2) Hỏi StarCi AI về bài này** (anchor luôn-hiện, khi BE sẵn) → Ôn lại (flashcards, ẩn) → Luyện tập (challenges).
Trước khi có D2: TOC → Flashcards(ẩn) → Challenges (fix reliable).

---

## ROUND 4 (2026-06-18) — "Hỏi AI" thành FAB float + dời ACTIONS vào red box (thầy)
> Thầy: *"hỏi AI làm cái FLOAT, click ra chat với AI"* + *"mấy cái action bỏ vào cái màu đỏ được không"* (red box =
> rail phải dưới TOC). Tức: **AI rời rail → nút nổi bottom-right**; **action bài (yêu thích/lưu/chia sẻ/toàn màn hình)
> rời thanh inline dưới content → vào rail**.

### Hiện trạng (inventory)
- AI ở rail = `ContentAiCopilot` (panel có nút mở drawer). Drawer chat `ContentAiChatDrawer` **đã có**.
- **Actions** = thanh ngang DƯỚI content (`ContentDiscussion`/`ActionToolbar`): **Yêu thích · Lưu · Chia sẻ · Xem toàn
  màn hình** — đều đã wire (toggleFavorite · bookmark · share overlay · content/fullscreen overlay).

### Hướng
- **D1 ✅ CHỐT — AI = FAB float + actions → rail.**
  - **`ContentAiFab`** (mới): pill nổi **bottom-right** (`✨ Hỏi AI`), luôn hiện trên trang đọc bài → click `open()` mở
    `ContentAiChatDrawer` (overlay store `contentAiChat`, đã có). **Bỏ `ContentAiCopilot` khỏi rail.** AI thành
    **first-class always-on** (kể cả khi rail ẩn / mobile), đúng pattern trợ-lý-AI (ChatGPT/Intercom/Gemini float).
  - **Rail `OnThisPage`** = TOC → **Actions** (yêu thích/lưu/chia sẻ/toàn màn hình — dời từ thanh inline) → Flashcards
    (ẩn) → Challenges. **Bỏ thanh `ActionToolbar` inline** (dedup) → content gọn hơn.
- D2 — AI=FAB nhưng actions GIỮ inline (rail = TOC + flashcards + challenges): ít việc nhưng red box mỏng + thầy đã bảo dời.
- D3 — giữ AI trong rail: thầy bỏ.

→ **CHỐT D1.** FAB cho AI (nổi bật + luôn-có), rail lấp red box bằng **actions** (luôn-hiện cạnh bài), thanh inline bỏ.

### IA rail phải (sau D1)
1. **TOC** "Trên trang này".
2. **Actions** (mới trong rail): yêu thích · lưu · chia sẻ · xem toàn màn hình — dạng list dọc icon+nhãn (block `ListRow`/`SidebarNavItem`-like) hoặc 1 hàng icon gọn.
3. **Flashcards** (ẩn) · **Challenges**.
> AI KHÔNG còn ở rail → ở FAB.

### Section → dữ liệu / state
| Phần | Nguồn / hành động | State |
|---|---|---|
| FAB Hỏi AI | `useContentAiChatOverlayState().open` → drawer | luôn hiện khi có `content.id` |
| Yêu thích | `mutateToggleFavorite` (đã có) | optimistic |
| Lưu (bookmark) | mutation bookmark (đã có ở `ContentDiscussion`) | optimistic |
| Chia sẻ | `useShareOverlayState` | overlay |
| Toàn màn hình | `useContentOverlayState` | overlay |

### Cắt / Thêm / Đừng-vỡ
- **THÊM:** `ContentAiFab` (mount ở learn layout, lg+mobile); **Actions trong rail** (tách block `ContentActions` props-only nếu cần — nhận các callback từ feature).
- **CẮT:** `ContentAiCopilot` khỏi rail; **thanh `ActionToolbar` inline** dưới content (dời lên rail).
- **Đừng-vỡ:** rail vẫn tự ẩn khi bài 0 heading → **actions cũng ẩn theo** (cân nhắc: actions nên CŨNG ở FAB-menu hoặc decouple rail-visibility nếu muốn luôn-có). FAB tránh đè dev-indicator (prod sạch). Mobile: FAB ok; rail ẩn → actions chỉ ở rail = mất trên mobile → cân nhắc giữ 1 thanh action mobile hoặc cho actions vào FAB-menu. Comments/discussion (dưới actions cũ) GIỮ inline (không vào rail).

→ Thầy duyệt **D1** → `/ux-apply`: dựng `ContentAiFab` + dời actions vào rail + bỏ panel AI cũ + bỏ thanh inline.

### > CHỐT 2026-06-18 (thầy)
- **FAB = hình TRÒN có LINH VẬT, đầu lòi ra trên.** Nút tròn (bg + bóng), ảnh mascot bên trong, **đầu mascot tràn lên
  trên mép tròn** (`overflow-visible` + ảnh cao hơn vòng / absolute -top). **Cần ASSET ảnh mascot riêng cho FAB —
  thầy cấp** (tạm: dùng mascot có sẵn / sparkle placeholder, để cấu trúc overflow sẵn, thay ảnh sau). Bottom-right,
  luôn hiện khi có `content.id` → click mở `ContentAiChatDrawer`.
- **Mobile actions = DRAWER.** Rail (TOC + actions) trên mobile đi vào **drawer** (đã có `LearnMobileBar` mở rail phải
  thành drawer) → actions không mất trên mobile, không cần thanh inline. Desktop: actions ở rail; Mobile: trong drawer rail.
- IA cuối: **FAB(AI tròn+mascot) nổi** · **Rail/Drawer** = TOC → Actions(yêu thích/lưu/chia sẻ/toàn màn hình) → Flashcards → Challenges · **bỏ** panel AI rail + thanh action inline.
→ `/ux-apply`: FAB (cấu trúc overflow chờ ảnh thật) + ContentActions vào rail + mobile drawer + dọn dead.
