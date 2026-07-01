# UX Brainstorm — Landing section "Kho tàng nội dung" (highlight bài code + infra)

> Section MỚI cho landing. Mindset-first, grounded-in-data. KHÔNG code. (skill `/starci-fe-ux-brainstorm`, 2026-06-26)

## Ý tưởng (thầy yêu cầu)
Đọc content thật → lấy những bài/chủ đề ĐỈNH (cả **code** lẫn **hạ tầng/infra**) → highlight để nói "đây là **kho tàng** của StarCi Academy". Phân biệt với section capstone ([[SYSTEMS-UX-BRAINSTORM]]): capstone = "bạn DỰNG hệ thống gì"; kho tàng = "bạn HỌC được chiều sâu gì" (curriculum treasure, chống định kiến "tutorial mill").

## Dữ liệu THẬT (đào content `.mount/data/courses/*`)
- **Quy mô:** ~84 module · hàng nghìn bài (⚠️ `platformStats.totalLessons = COUNT(ContentEntity)` đếm CẢ vi+en → phồng ~2×; con số "thật" để khoe nên dùng **module count** hoặc số đã-dedupe, vd "80+ module · 2.000+ bài"). System Design dạy 4 ngôn ngữ (TS/Java/C#/Go); AI/LLM TS+Python.
- **Trophy topics rút từ tiêu đề bài THẬT** (verifiable), 2 nhóm:
  - **CODE/thuật toán:** Redlock & Fencing Token (SD M18) · 2PC vs Saga Choreography (SD M19) · Token bucket + Redis Lua atomic (SD M15) · Kafka exactly-once/consumer group (SD M4) · Redis Cluster 16384 hash slot (SD M6) · RAG + pgvector (FS M20) · Webhook idempotency & hoàn tiền (FS M22) · XSS/CSRF/CORS (FS M17).
  - **INFRA/vận hành:** K8s Control Plane apiserver/etcd/scheduler (DO M19) · Argo Rollouts progressive delivery (DO M23) · SLSA & Sigstore supply-chain (DO M26) · Falco runtime security (DO M26) · OpenTelemetry/Jaeger tracing (SD M7) · Terraform multi-cloud (DO M19/20) · Adaptive Bitrate HLS/DASH (SD M11) · Redis Pub/Sub + Presence bitmaps (SD M21).

### Data availability (cho khâu apply) — TIN TỐT
- `courses → modules → contents` **PUBLIC, no auth** (chỉ soft-throttle). Module + content **title/displayId/difficulty/minutesRead đều @Field công khai** → landing **lấy được tên bài THẬT** mà không cần login.
- `platformStats` (PUBLIC) đã có totalLessons/totalCourses (StatStrip đang dùng).
- ⚠️ Lưu ý: ContentEntity **không có `isPremium`** ở GraphQL → tên bài premium cũng lộ công khai (không sao cho showcase — ta curate tên không-spoiler). totalLessons phồng vì i18n.
- Có `autocompleteGlobalSearch` (ES, public) index tên bài → có thể làm search "khám phá chủ đề".

## Mục tiêu section (≤30s, visitor lạ)
1. Chứng minh **chiều sâu + bề rộng THẬT**: dạy đúng các bài hóc búa senior/recruiter công nhận (không phải overview 1-slide).
2. Trả lời trực tiếp "**cả code cả infra**" — 2 trục StarCi mạnh.
3. Neo vào số liệu thật (module/bài) + dẫn vào catalog/khóa.

## 3 hướng (xem widget)
- **A — Đám mây chủ đề (breadth-led):** rừng chip tên bài thật wrap dày + 1 dòng số liệu. Đập "bề rộng". *Trade-off:* nhiều chip → loãng, thiếu phân cấp code/infra.
- **B — Lưới trophy tuyển chọn (depth-led):** ~8-12 thẻ bài tuyển: tên thật + 1 dòng "vì sao khó" + khóa + độ khó. Uy tín nhất từng item. *Trade-off:* không tách rõ code/infra; ít item.
- **C — Hai làn Code ↔ Hạ tầng (CHỐT) ✅:** 2 cột "Bạn viết code gì" | "Bạn vận hành hạ tầng gì", mỗi cột 6 chip bài thật + tag khóa, footer "Xem toàn bộ chương trình". **Khớp đúng yêu cầu thầy** ("cả code cả infra"), phân cấp rõ, vẫn khoe được số.

### Chốt: Hướng C
Lý do: thầy nói rõ "cả code cả infra" → 2 làn là cách kể chuyện trực diện nhất; mỗi chip là bài THẬT (uy tín) + tag khóa (điều hướng), footer neo số liệu thật. A loãng, B không tách được 2 trục thầy muốn.

## Section → dữ liệu (cho apply)
| Phần tử | Nguồn | Ghi chú |
|---|---|---|
| Tên bài trophy (Redlock…) | **Curated config** (lane + courseDisplayId + contentDisplayId) | Tuyển 12-14, rút TỪ content thật; editorial, kiểm soát chất lượng + tránh spoiler/premium. |
| Tag khóa (SD/FS/DO/AI) | Curated (suy từ courseDisplayId) | |
| Link chip → bài/khóa | `publicContent`/route khóa (PUBLIC) | displayId có sẵn → link tới bài thật (self-healing nếu bài tồn tại); hoặc link tới trang khóa. |
| Số "80+ module · 2.000+ bài" | `platformStats` (PUBLIC, StatStrip đã có) | ⚠️ totalLessons phồng i18n → cân nhắc hiện **module count** hoặc số conservative; lý tưởng thêm BE count dedupe. |
| (tùy chọn) search chủ đề | `autocompleteGlobalSearch` (PUBLIC) | nếu muốn cho user tự tra "có dạy X không". |

**2 mức grounding (hỏi thầy):**
- **(C1) Curated tĩnh** (đơn giản, đúng, kiểm soát): tên bài trong config. Rủi ro drift nếu đổi content (thấp, vì là tiêu đề ổn định).
- **(C2) Curated + link động:** giữ list curated nhưng mỗi chip link tới bài thật qua displayId (public) → bấm xem được. +ít việc, tăng tin cậy ("không phải chữ suông"). Đề xuất **C2** vì data đã public.

## Cắt / Thêm
- **THÊM:** section "Kho tàng" (đặt SAU section capstone — "bạn build hệ thống này, và đây là chiều sâu đằng sau") + config trophy 2 làn + i18n `landing.treasure.*` + (tùy chọn) link chip.
- **State:** curated config → luôn render (không phụ thuộc fetch); số liệu lấy `platformStats` (fail → ẩn dòng số như StatStrip, phần chip vẫn đứng). Mỗi chip link → nếu bài 404 thì fallback link trang khóa.
- **KHÔNG** liệt kê hết 2.000 bài (loãng + vanity) — chỉ ~12 trophy + 1 lối "xem toàn bộ".

## Ref
- "Topics / what you'll learn" showcase: Educative ("what you'll learn" trophy list), Frontend Masters (topic breadth), Boot.dev. Pattern 2-lane "code vs ops" hợp domain fullstack+infra.
- Rules nội bộ: [[design-for-data-that-exists-coverless-lowvolume]] (thiết kế theo data thật, curate item mạnh thay vì đổ hết), [[whitespace-over-dividers]] (cắt count vanity), [[concepts/single-source-render]] (nếu dùng số → 1 nguồn platformStats).

→ Thầy chọn hướng (mặc định C) + C1/C2 → `/starci-fe-ux-apply` để dựng.
