# KnowledgeGraph — pivot force-graph → GRID WRAP (2026-06-29)

Thầy: *"bong bóng chiếm full width thì thấy ghê quá, có plan nào split kiểu grid wrap k"*.

Bản force-graph hiện tại (`index.tsx` + `ConceptNode.tsx`, d3-force live, full-bleed `h-[460px] sm:h-[560px] w-full`) đọc **chaotic**: canvas tràn, bubble chồng, size lệch (degree→radius), label tràn ngang đè hàng xóm. Pivot sang **grid wrap** (chip nhóm theo track) — giữ proof, bỏ chaos.

## Mục tiêu section (giữ nguyên)
Header: *"Học để giải bài toán thật, không học để thuộc bài"* / *"Từ backend đến hạ tầng…"*. Việc của section = **chứng minh BREADTH + DEPTH của 1 stack THẬT, liên kết** (không CRUD). Cần giữ:
- **38 concept THẬT** (proof chiều rộng) — grounded từ curriculum.
- **3 track** color-coded (Fullstack=accent/pink · System Design=success/green · DevOps=warning/amber) = trục kể chuyện.
- **Concept → khóa dạy nó** (CTA, `LANDING_TRACK_COURSE_SLUG[track]`).
- **Blurb per concept** (`landing.treasure.graph.<id>`) — popover/tooltip khi tương tác.
- Số liệu breadth có thể nâng thành stat ("38 khái niệm · 3 lộ trình").

## Cái grid LÀM MẤT (so với force-graph) + cách bù
- **Live "lồng ghép" (cross-track edges + drag/zoom physics)** — đây là thứ duy nhất grid không có. Bù bằng: (a) 1 dòng caption interconnection ("Idempotency học ở System Design → tái dùng ở Payment, Webhooks (Fullstack)"); HOẶC (b) vài chip cross-track đánh dấu nhẹ. KHÔNG cố mô phỏng đồ thị trong grid.
- Trade-off thầy đã ngầm chấp nhận: bớt "wow động" để lấy "sạch + đọc được".

## Data (đã có, không cần BE)
- Nguồn = `KnowledgeGraph/data.ts` (i18n/constant, KHÔNG query BE — đúng [[landing-grounded-real-courses-and-systems]]).
- 38 node: FS 12 · SD 14 · DevOps 12. Mỗi node: `track` (→ màu + course), `degree` (→ "sức nặng"), blurb i18n, CTA.
- Màu: dùng role-token `--bg-accent/--text-accent` (FS pink) · `success` (SD green) · `warning` (DevOps amber) — dark-mode safe.

## 3 HƯỚNG (đã vẽ widget cho thầy chọn)

### A — 3 cột theo track  ★ ĐỀ XUẤT
- 3 cột (`grid-cols-3`, mobile `grid-cols-1`), mỗi cột = `LabeledCard frameless`: header (dot màu track + tên + count) + chips wrap (`flex flex-wrap gap-2`) tint theo track.
- Chip = HeroUI `<Chip>` tint `bg-<token>/10 text-<token>` ([[elements/chip]]), click → khóa (hoặc hover → blurb popover).
- **Ưu:** sạch, cân, đối xứng, quét nhanh, mobile xếp dọc tự nhiên, đúng "3 vùng năng lực có nhãn riêng" ([[concepts/card]] — 2+ vùng ngang hàng có nhãn riêng = OK). **Nhược:** mất animation lồng ghép (bù bằng caption).
- Ref: skill/tech-stack columns (Stripe/Vercel "what you can build"), [[shared-axis-matrix-heroui-table]] họ "N item chung 1 trục → nhóm", [[dashboard-labeledcard-and-tabscard]] (LabeledCard).

### B — Bento có sức nặng (hub tiles + leaf chips)
- Giữ ý degree: concept trục (NestJS/Kafka/Kubernetes — hub) = **ô lớn** có blurb; concept phụ = chip nhỏ wrap. Vẫn nhóm/ngăn theo track.
- **Ưu:** giữ phân cấp + wow editorial. **Nhược:** nặng tay hơn, dễ "trộn màu" nếu không ngăn track rõ → cần section/divider per track. Phức tạp dựng hơn A.
- Ref: bento grid landing (Linear/Vercel feature bento).

### C — 3 hàng theo track
- Mỗi track = 1 hàng ngang: nhãn+dot+count trái (`w-28 shrink-0`) + chip wrap phải, ngăn `border-t`.
- **Ưu:** gọn nhất chiều dọc, đọc như "3 vùng năng lực", không bao giờ full-bleed. **Nhược:** ít wow hơn A; track nhiều chip → hàng dài.
- Ref: skill-row / tag-row layout.

## ✅ ĐÃ CHỐT (thầy duyệt 2026-06-29) — GIỮ GRAPH, hướng 2 (SPLIT)
Thầy: *"giữ bong bóng thế có nên không tại muốn flex trình nữa"* → chốt **GIỮ force-graph (flex engineering, proof build-in-public on-brand), KHÔNG sang grid.** Vấn đề cũ KHÔNG phải "bong bóng" mà là **(1) full-bleed + (2) chaos** → fix 2 lỗi đó, giữ wow.

### Layout = SPLIT (2 cột): copy flex TRÁI + graph contained PHẢI
- Section `#treasure`: desktop 2 cột; **mobile xếp dọc** (copy trên, graph dưới). Graph CHIẾM nửa lớn hơn (~`grid-cols-[0.85fr_1.15fr]` hoặc `lg:flex` graph `flex-[1.15]`), copy nửa nhỏ.
- **CỘT TRÁI (copy = "flex trình"):** chuyển message vào đây (KHÔNG để SectionHeading căn giữa full-width nữa, hoặc giữ eyebrow nhỏ trên):
  - Title + intro (giọng flex, đã có i18n `landing.treasure.*`).
  - **Editorial stat strip** (số to + label nhỏ — [[landing-marketing-section-spacing-and-editorial-stats]]): "38 khái niệm · 3 lộ trình" (GROUNDED: 38 node, 3 track). Có thể thêm "liên kết thật".
  - **1 dòng lồng ghép** (giữ ý interconnect bằng chữ, không cần edge animation phải đọc được): vd "Idempotency học ở System Design → tái dùng ở Payment, Webhooks (Fullstack)".
  - **CTA** primary "Xem khóa" → scroll `#courses` (hoặc `pathConfig().courses()`), icon + `size="lg"` ([[primary-cta-icon-size-lg]]).
- **CỘT PHẢI (graph contained):** `<KnowledgeGraph/>` y nguyên (kéo/zoom/live/ShuffleBeacon) NHƯNG:
  - Bỏ `w-full` full-bleed → fill width cột phải, height cố định (giữ `h-[460px] sm:h-[560px]` hoặc giảm chút). Khung `rounded-3xl border border-default` giữ nguyên.
  - **Nắn physics cho khung HẸP hơn** (cột phải ≈ nửa width → dễ chật hơn full-bleed): giảm độ dốc `bubbleRadius` (size variance nhỏ lại), tăng `collide` pad, label không tràn (truncate/giảm font scale), `forceX` anchor co lại theo width hẹp. Cân nhắc **giảm node hiển thị ~20–24** (curated, "+N" ngầm) nếu 38 node quá chật trong nửa cột.
  - Center/zoom lại để cụm fit khung hẹp (hiện `setCenter(0,0,zoom 1.2)` — có thể cần zoom thấp hơn cho cột hẹp).

### ✅ ĐÃ ÁP DỤNG 2026-06-29 (`/starci-fe-ux-apply`)
- `Landing/index.tsx` `#treasure`: section → SPLIT `grid lg:grid-cols-[0.85fr_1.15fr] items-center` — TRÁI = `SectionHeading align="start"` + stat editorial (`KNOWLEDGE_NODES.length`=38 · `LANDING_COURSE_TRACKS.length`=3, số to + label muted + divider `w-px bg-default`) + dòng `landing.treasure.interconnect` + CTA `Button primary lg "Xem khóa"` → `onSeeCourses` (#courses). PHẢI = `<KnowledgeGraph/>` (giữ nguyên API, hết `w-full` full-bleed → fill cột phải). Mobile `grid-cols-1` → stack (copy trên, graph dưới).
- Nắn cho khung hẹp: `data.ts bubbleRadius` `18+deg*6` → `16+deg*4` (hub 66→48px); `ConceptNode fontSize` `10+deg*1.3` → `11+deg*0.8`; `index.tsx` collide pad +12 → +14. (Single-source — mọi nơi đọc `bubbleRadius`.)
- i18n: `landing.treasure.{statConcepts,statTracks,interconnect,cta}` (vi+en, thêm vào CẢ 2 block treasure trùng — xem nợ). tsc + eslint sạch.
- **Verify (preview :61156, dark):** desktop gridCols `442px 598px` side-by-side, graph 558px, copy centered; mobile `343px` stacked. Route 200. (Screenshot raster stall do R3F+d3 loop; DOM geometry confirm.)
- **Nợ:** `landing.treasure` bị trùng key trong `landing` (vi+en, ~line 2636 + 2795 — last-wins, block đầu dead) → đã spawn task dọn. `index.tsx` (ReactFlow)/`ConceptNode`/`ShuffleBeacon`/`data.ts` VẪN dùng (graph giữ) → KHÔNG xoá.

### ⚠️ Rủi ro thực thi chính
- 38 glowing bubble trong **nửa cột (~420–520px)** = dễ chật hơn full-bleed. → **PHẢI** nắn (giảm size variance + collide + có thể cap node). Verify mắt trên desktop + mobile (touch drag) + dark/light TRƯỚC khi chốt số node.

## (Lưu hồ sơ) 3 hướng grid đã loại + 4 framing graph
- Grid A/B/C (3 cột / bento / 3 hàng) = **loại** (thầy muốn giữ flex graph). Giữ doc làm hồ sơ nếu sau đổi ý.
- Framing graph: (hiện tại full-bleed = lỗi) · 1 showpiece đóng khung · **2 split copy+graph ← CHỐT** · 3 hybrid grid+toggle.

## Khi apply (`/starci-fe-ux-apply`)
- Thay `<KnowledgeGraph/>` (force-graph) trong `Landing/index.tsx` section `#treasure` bằng block grid mới.
- Tách màu/chip vào constant (literal className per token — Tailwind cần literal, KHÔNG nội suy runtime — [[elements/chip]]).
- Giữ `data.ts` nodes (bỏ edges/degree nếu A/C; B giữ degree cho hub). Click chip → `course(LANDING_TRACK_COURSE_SLUG[track])`; blurb → popover/tooltip per chip.
- **Nợ dọn:** `index.tsx` (ReactFlow), `ConceptNode.tsx`, `ShuffleBeacon`, dep `d3-force`/`@types/d3-force`/`@xyflow` (nếu mind-map không còn dùng) → mồ côi, xoá khi dọn.
- KHÔNG emoji, sentence case, chip semantic tint `/10` ([[no-emoji]] · [[no-uppercase-text]] · [[elements/chip]]).
