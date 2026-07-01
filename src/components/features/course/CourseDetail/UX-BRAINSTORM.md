# Course detail → marketing-first landing (UX brainstorm)

> `/ux-brainstorm` · trang `/courses/<slug>` (vd `devops-mastery`) · 2026-06-18 · hướng **marketing-first**
> Bản cũ `layouts/course/Course/**` = **LEGACY (inventory thôi)**. Tư duy từ mindset, KHÔNG bê cấu trúc cũ.

## ⟳ Refinement v2 — feedback sau khi nhìn bản dựng (2026-06-18)
Thầy soi live, 3 vấn đề + chốt cách sửa (cho `/ux-apply` lần 2):

1. **TRÙNG 2 khối purchase** (xác nhận có). Hero-trái có `giá + Đăng ký + Học thử`; card phải cũng `giá + ladder +
   Đăng ký + Học thử` → 2 hộp mua cạnh nhau, loãng. **CHỐT: gộp về 1 hộp mua duy nhất bên phải.**
   - **Hero-trái = title + lead value + trust-stats THÔI** (BỎ block giá + BỎ cụm CTA ở hero).
   - **Cột phải = 1 "purchase card" sticky** = **đưa ẢNH COVER vào đầu card** (cover đang ở hero-phải → chuyển vào
     card) + giá + (ladder gọn) + CTA + social proof. Thành 1 đơn vị mua kiểu Udemy (thumbnail→giá→nút), trên-fold
     desktop. Mobile: hero → purchase card → narrative + sticky bottom bar (CTA dưới vẫn còn).

2. **Card giá "Còn 50 suất" rối thông tin.** Hiện: headline `1,490,000đ` + `Còn 50 suất`, rồi ladder 3 dòng mỗi dòng
   nhồi `-41% · Còn 30 suất`, `Đang áp dụng · -26% · Còn 50 suất`, … → lặp "Còn 50 suất" 2 lần, chip chồng chip.
   **CHỐT đơn giản hoá — 1 tín hiệu/ý, không lặp:**
   - **Headline**: giá hiện tại (to) + 1 chip `-26%` + **1 dòng khan hiếm DUY NHẤT** ("Còn 50 suất giá Sớm").
   - **Urgency = giá SẮP TĂNG, không phải đếm chip**: thêm 1 dòng mờ "Sau đó: ~~giá~~ **2.000.000đ**" (phase kế).
   - **Ladder = stepper mảnh** (Tiên phong ✓đã hết · **Sớm ● hiện tại** · Tiêu chuẩn ○) — KHÔNG mỗi dòng 3 chip.
     Bỏ "Còn 50 suất" lặp ở dòng Sớm (đã ở headline); bỏ giá dòng hiện-tại (đã ở headline). Chỉ giữ giá các phase KHÁC.
   - Mục tiêu: liếc 1 giây hiểu "giá giờ X, còn N suất, không mua thì lên Y".

3. **Preview content + accordion-in-card padding.** (a) Render **preview bullets** của module (đang ẩn trong panel —
   hiện rõ khi mở; cân nhắc badge "N bài xem trước"). (b) **Accordion nằm trong card → card BỎ padding** (accordion tự
   có mép/divider; card pad nữa = lệch + double). → curriculum/FAQ dùng `LabeledCard` **content không padding** (vd
   `contentClassName="p-0"` hoặc biến thể no-pad), để accordion tràn sát mép. (Rút thành rule chung → draft.)

**Tóm IA sau refine:** Hero(title+value+stats) · cột trái narrative(value-props/curriculum/prereq/faq) · cột phải =
1 purchase card(cover+giá+stepper-gọn+CTA+proof) sticky · mobile sticky bar. Hết trùng, card giá gọn, accordion sát mép.

---


## Mục tiêu (≤30s người lạ phải "muốn mua")
Trang này là **trang bán hàng**, không phải mục lục. Khách (chưa enroll) cần thấy NGAY: *học xong làm được gì ·
ai đã học · giá + lý do mua giờ*. Hiện trang đi **content-first** (title → modules → Q&A), pricing nhét sidebar,
value-prop nằm SAU giá, không social proof, không above-fold CTA → đọc như catalog nội bộ.

## Inventory (chỉ để biết DỮ LIỆU THẬT — query `course` by slug)
**Có sẵn, giàu:** `title·description·coverImageUrl` · **`valuePropositions[]`** (bullet marketing) ·
**`pricingPhases[]`** (Pioneer/EarlyBird/Regular + `price/priceUsd` + **`slotAvailable`** + `currentPhase`) ·
`originalPrice(Usd)` · **`enrollmentCount`** (CQRS, social proof THẬT) · `prerequisites[]` · **`qnas[]`** (FAQ) ·
`modules[]` (`title·description·contentTier` Foundation/Inter/Advanced · `isPremium` · **`numContents`** ·
**`previewContents[]`** = free teaser) · `contents[]` (`minutesRead` · `difficulty` · **`outcomes[]`** "what you'll learn") ·
`livestreamSessions[]` (lịch LIVE tuần) · `flashcardDecks[]` (interview prep).
**Suy được CLIENT (0 BE):** tổng module · tổng lesson (Σ`numContents`) · **tổng giờ** (Σ`minutesRead`) · tổng challenge ·
dải độ khó (contentTier).

**Pain bản cũ (file:line từ audit):** `@gravity-ui` icon (EnrollCard/ModuleItem/ValueProps/map) · `<h1 text-4xl>` thay
Typography · style rò vào feature (EnrollCard/PhasePrices) · **KHÔNG `AsyncContent`** (Modules/QnA/ValueProps fork ternary) ·
`dangerouslySetInnerHTML` nhiều chỗ (XSS + không markdown) · **`MODULE_SUMMARY_ITEMS` đếm GIẢ hardcode** (12/8/3) ·
prerequisites tô **warning-vàng** (đọc như chặn) · pricing+CTA ở sidebar dưới value-prop · copy khô (`Enroll`).

## 3 hướng → CHỐT
- **A. Long-form sales page** (1 cột dọc: hero→outcomes→curriculum→pricing→FAQ→CTA, sticky bar dưới). Bán mạnh nhất
  nhưng mất "rail giá luôn thấy" trên desktop; dài.
- **B. Giữ 2-cột sidebar (nâng cấp)**: trái content / phải enroll-card sticky như cũ, chỉ làm giàu + đưa value above-fold.
  An toàn, ít wow, vẫn "catalog có giá".
- **C. ✅ CHỐT — Hero-led + sticky purchase rail (hybrid)**: **HERO full-width** (value-prop + CTA + social proof +
  trust-stats above-fold) → rồi **2-cột**: TRÁI = narrative bán hàng (outcomes → curriculum → instructor → FAQ),
  PHẢI = **rail giá STICKY** (pricingPhases + scarcity slot + CTA, luôn trong tầm mắt). Đây là chuẩn course-landing
  hiện đại (Udemy/Teachable/Coursera) — vừa kể chuyện vừa giữ nút mua. Ăn cắp pattern đã chứng minh.

## IA marketing-first (thứ tự = phễu chuyển đổi)
1. **HERO** (above-fold, full-width): `title` + 1 dòng value (`valuePropositions[0]`/description ngắn) + **trust-stats
   strip** (Σ giờ · N module · N lesson · N challenge · `enrollmentCount` "đang học") + **CTA chính "Tham gia ngay"** +
   phụ "Học thử miễn phí" + giá `currentPhase` (VND chính/USD phụ) + `coverImageUrl`. (KHÔNG badge livestream — đã cắt.)
2. **What you'll learn** (cao, ngay sau hero): `valuePropositions[]` lưới ✓ (marketing bullets) — đây là "được gì", lên TRƯỚC giá.
3. **Curriculum**: `modules[]` accordion — `contentTier` badge + `numContents` THẬT + Σ`minutesRead`/module + khóa
   `isPremium` + `previewContents[]` (free teaser) + difficulty. Header: "N module · N nội dung · Σ giờ".
4. **Outcomes chi tiết** (optional, gộp vào curriculum): `contents[].outcomes` "sẽ làm được".
5. **Format/đặc sản**: interview prep (`flashcardDecks`) + challenge thực hành. (KHÔNG livestream — đã cắt.)
6. **Reviews/ratings** (social proof mạnh) — ⚠️ **PHỤ THUỘC feature review MỚI** (xem Quyết định): sao trung bình +
   số lượng + vài review tiêu biểu. Trang landing **ẩn mục này** cho tới khi review feature lên (rỗng → tự ẩn theo §7).
7. **Pricing rail (sticky, cột phải)**: `pricingPhases` (Pioneer→EarlyBird→Regular) + **scarcity `slotAvailable`**
   ("chỉ còn N suất giá Pioneer") + `currentPhase` nổi + save% + CTA. Đây là động cơ urgency có sẵn data — phải khai thác.
8. **Before you start**: `prerequisites[]` (tone trung tính "cần biết trước", **BỎ warning-vàng**).
9. **FAQ**: `qnas[]` accordion.
10. **Final CTA** + (mobile) **sticky bottom enroll bar** (giá + nút, luôn hiện).
> KHÔNG có section **Instructor** (thầy chốt cắt — proof dựa `enrollmentCount` + reviews + leaderboard).

## Section → dữ liệu BE
| Section | Field | Ghi chú |
|---|---|---|
| Hero stats | Σ`numContents` · Σ`minutesRead` · `modules.length` · `enrollmentCount` | suy client, 0 BE |
| Value/"được gì" | `valuePropositions[]` | đưa LÊN trước giá |
| Curriculum | `modules[]`+`previewContents`+`numContents`+`contentTier`+`isPremium`+Σ`minutesRead` | bỏ counts GIẢ map.ts |
| Outcomes | `contents[].outcomes[]` | "what you'll learn" |
| Pricing rail | `pricingPhases[]`+`slotAvailable`+`currentPhase`+`originalPrice(Usd)` | scarcity + save% |
| Social proof | `enrollmentCount` | THẬT (CQRS) |
| Format | `flashcardDecks[]` · challenge | đặc sản (livestream đã cắt) |
| Reviews | (feature MỚI) `courseReviews` avg/count | track riêng, ẩn khi chưa có |
| Before you start | `prerequisites[]` | bỏ warning tone |
| FAQ | `qnas[]` | |

## Quyết định gap (thầy chốt 2026-06-18)
- **Instructor → CẮT.** Không có entity giảng viên → bỏ hẳn section, không fake. Proof = `enrollmentCount` + reviews + leaderboard.
- **Rating/review → XÂY FEATURE MỚI.** Cần BE entity review/rating (sao + nội dung + 1 review/user/course) + query
  `courseReviews` + aggregate (avg, count) + mutation `submitReview` (gate: chỉ enrolled mới review) + FE block sao.
  **=> Track riêng** (BE+FE), làm TRƯỚC khi mục #6 hiển thị; landing ship trước với mục reviews **tự ẩn** (rỗng).
- **Livestream → CẮT khỏi trang.** Không show lịch/badge LIVE; giữ `livestreamSessions` cho learner CMS như cũ.

## Cắt / thêm / sửa-nợ-rule
- **Thêm**: hero above-fold (value+CTA+social proof+trust-stats) · sticky pricing rail + scarcity slot · sticky mobile
  enroll bar · curriculum đếm THẬT · outcomes · format(live/flashcard).
- **Cắt**: `MODULE_SUMMARY_ITEMS` đếm giả · prerequisites warning-vàng · pricing-giấu-sidebar-dưới-value.
- **Sửa nợ rule (khi /ux-apply → /ui-apply)**: `@gravity-ui`→phosphor `*Icon` size-5 · `<h1>`→`Typography.Heading` ·
  style rò→block/globals · mọi fetch→`AsyncContent` (skeleton mirror/empty/error) · `dangerouslySetInnerHTML`→
  `MarkdownContent` sanitize · copy khô→i18n marketing ("Làm chủ X", "Tham gia N học viên").
- **States/a11y**: hero/curriculum/FAQ mỗi vùng fetch → `AsyncContent`; rỗng tự ẩn (course thiếu FAQ → giấu mục);
  tab URL nếu tách tab; CTA 1 primary/màn; contrast + focus ring + `prefers-reduced-motion` cho hero animation.

## Thứ tự thi công (đã chốt gap)
1. **`/ux-apply`** dựng landing hướng C: hero + what-you'll-learn + curriculum(đếm thật) + format(flashcard/challenge) +
   pricing-rail-sticky(scarcity) + prerequisites + FAQ + sticky-mobile-bar. **Bỏ** instructor + livestream. Mục reviews
   để **placeholder tự-ẩn**. Sửa nợ rule (phosphor/Typography/AsyncContent/markdown/copy marketing).
2. **Track riêng — feature Review**: BE entity review + `courseReviews`/`submitReview` (gate enrolled) + FE block sao →
   bật mục #6 trên landing.
3. **`/ui-apply`** đánh bóng pixel sau khi cấu trúc xong.

---

## ⟳ Refinement v3 — RHYTHM / GAP pass (2026-06-24)
Thầy soi live bản đã dựng (`CourseDetail/**`): *"trang này sai về gap"*. Trang IA đã ổn (đúng v2: narrative trái + sticky purchase card phải); **vấn đề là NHỊP DỌC lệch scale 0/2/3/4/6**.

### Lỗi gap thật (audit `CourseDetail/index.tsx`)
- L91 sections `gap-10` (40px) · L93 grid 2 cột `gap-8` (32px) · L69-70 skeleton `gap-10/gap-8` · `CoursePricingRail` L78 headline `gap-1` (4px) · L72 card interior `gap-4` · L65 mobile `pb-24` tùy tiện. → 1/4/5/8/10 đều **ngoài scale {0,2,3,4,6}** (= 0/8/12/16/24px).

### Luật nhịp CHỐT (áp trang này; rút thành draft chung)
- **`gap-6`** = giữa 2 khối / 2 vùng khác chức năng — **kể cả grid trái(narrative)↔phải(pricing)** và giữa các section (Hero/ValueProps/Curriculum/Prereq/FAQ). (gap-10/gap-8 → gap-6.)
- **`gap-3`** = trong 1 khối (LabeledCard label↔content, item↔item, hàng card). **Pricing card interior `gap-4`→`gap-3`.**
- **`gap-2`** = cụm con sát: **giá + chip giảm** (`gap-1`→`gap-2`), stat pair.
- **CẤM** gap-1/5/8/10; mobile clearance cho sticky bar KHÔNG dùng `pb-24` tùy tiện → spacer/token đặt tên đo đúng chiều cao bar.
- **Skeleton mirror đúng nhịp mới** (gap-6), không để lệch loaded.

### Kèm theo (nhỏ, cùng pass)
- **Ẩn stat = 0**: "0 Học viên" (khóa mới) → ẩn dòng, KHÔNG render "0" (phản-social-proof). Dẫn bằng stat khối-lượng (24 Module · 87 Nội dung · 276 Bài thực hành · 31 Giờ). Ref `design-for-data-that-exists-coverless-lowvolume`.
- **Cover null → fallback gradient** (coverImageUrl thường null) — không vỡ card.

### Hướng chốt = **A** (chuẩn-hoá nhịp + ẩn 0-stat + cover fallback). Rủi ro thấp, đúng "sai về gap". 
Follow-up tùy chọn **B**: surface `livestreamSessions` (lớp live hàng tuần) + `flashcardDecks` (ôn phỏng vấn) — 2 field đang phí, mạnh "what you get". Hỏi thầy trước.

### → `/ux-apply` chỉ cần: nắn gap về scale (index.tsx + CoursePricingRail + skeleton) + ẩn stat 0 + cover fallback. KHÔNG đổi IA.
