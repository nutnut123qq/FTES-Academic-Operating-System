# UX Brainstorm — Landing section "Những hệ thống bạn tự tay dựng"

> Re-design 1 section của landing. Mindset-first, grounded-in-data. KHÔNG code. (skill `/starci-fe-ux-brainstorm`, 2026-06-26)

## Vấn đề
Section hiện (`features/landing/Landing/index.tsx` L210–245 + `constants/index.ts` `LANDING_SYSTEM_KEYS`/`LANDING_SYSTEM_FLOWS`) render **6 hệ thống GIẢ** hardcode (News Feed/Flash Sale/Ví điện tử/Gọi xe/Chat/K8s). Đây là ví dụ CS phổ thông — KHÔNG phải capstone thật của StarCi. Pitch "không phải CRUD, hệ thống chạy thật ở production" đang được minh hoạ bằng đồ giả → **mất uy tín nếu học viên đối chiếu khóa học**.

## Dữ liệu THẬT (đọc từ content `.mount/data/courses/*` + BE entities)
StarCi có **4 khóa = 4 capstone** (mỗi capstone = 1 hệ thống production học viên tự dựng, 20 chặng · 100 task chấm điểm):

| Khóa (displayId) | Capstone | Hệ thống | Chặng · Task | Stage tiêu biểu | Tag chữ ký |
|---|---|---|---|---|---|
| system-design-mastery | **The Shop** | Ecommerce microservices 4 ngôn ngữ (TS/Java/C#/Go) | 20 · 100 | Gateway→Kafka→Saga→K8s | DISTRIBUTED-TX |
| fullstack-mastery | **StarCi Shop** | Ecommerce full-stack (Node + React) | 20 · 100 | Auth→Cart→Pay→Deploy | FULL-STACK |
| devops-mastery | **Opsboard** | Hạ tầng SRE multi-cloud | 20 · 100 | Terraform→K8s→GitOps→SLO | ZERO-DOWNTIME |
| ai-llm-engineering | **StarCi Copilot** | Trợ lý RAG/agentic (TS + Python) | *0 · 0 (chưa scaffold)* | Retrieval→Agent→Guardrail | RAG·AGENTS |

→ **"Số dự án" thật = 4 capstone (3 đã build đủ + 1 sắp ra mắt) · 300+ task chấm điểm.** (KHÔNG phải 6.)

### Data gap (quan trọng cho khâu apply)
- **PUBLIC (landing fetch được, no auth):** `courses` (title/displayId/description/coverImageUrl/enrollmentCount/valuePropositions) + `platformStats` (totalCourses…).
- **GATED (auth + enrolled):** `milestones`/`milestone` (chặng + task + stage). → Landing **KHÔNG** lấy được số chặng/task/pipeline công khai bằng query hiện có.
- **Tên capstone + stage pipeline + tag chữ ký** hiện chỉ nằm trong content markdown (mount) — chưa expose thành field cấu trúc của course.

## Mục tiêu section (≤30s, visitor lạ)
1. Chứng minh "bạn build HỆ THỐNG THẬT (phân tán/hạ tầng/AI), không phải CRUD" — **bằng capstone thật**.
2. (mới) Làm **cửa khám phá khóa**: mỗi capstone → khóa tương ứng (section đang chết về điều hướng).
3. Khoe **độ sâu thật**: 20 chặng · 100 task / capstone → "300+ task chấm điểm".

## 3 hướng (xem widget mockup)
- **A — Lưới thẻ capstone (discovery-led):** 4 thẻ (2×2) = tên capstone + khóa + pipeline ngắn + chip "20 chặng·100 task" + "Xem khóa →". Honest + điều hướng tốt. *Trade-off:* 4 thẻ (vs 6) lưới hơi thưa; bỏ chất "punchy" hiện tại.
- **B — Hero 1 capstone + rail nhiều chặng (depth-led):** 1 capstone tiêu biểu (The Shop) full rail stage + 3 metric (20/100/4) + 3 chip nhỏ cho các capstone khác. Đập mạnh "độ sâu 1 hệ thống". *Trade-off:* thiên vị 1 khóa, yếu điều hướng + cân bằng.
- **C — Hybrid honest (CHỐT) ✅:** GIỮ nguyên DNA visual đang thích (icon + tên + tag chữ ký phải + pipeline pill + caption) nhưng thay 6 giả → **4 capstone thật**, mỗi thẻ **bấm được → khóa**, caption = "20 chặng · 100 task". *Trade-off:* cần nguồn cho stage + tag (xem dưới).

### Chốt: Hướng C
Lý do: bước nhảy nhỏ nhất từ hiện trạng (giữ aesthetic thầy đã duyệt), **sửa được cái sai cốt lõi** (đồ giả→thật), thêm điều hướng (clickable) + độ sâu thật. A/B đều đánh đổi cái đang chạy tốt.

## Section → dữ liệu (cho khâu apply)
| Phần tử thẻ | Nguồn | Ghi chú |
|---|---|---|
| Tên capstone (The Shop…) | **Curated FE config keyed by course.displayId** | Editorial, rút TỪ content thật vừa đọc; 4 item, ổn định. |
| Tag chữ ký (DISTRIBUTED-TX…) | Curated config | Như trên. |
| Pipeline stage (Gateway→Kafka→…) | Curated config (rút từ milestone content) | Stage M0/M19 ổn định; không cần fetch. |
| Khóa title + link + coverImage | `courses` query (PUBLIC) | Map qua displayId → route khóa. |
| Chip "20 chặng · 100 task" | **2 lựa chọn** ↓ | |
| Trạng thái "Sắp ra mắt" | Curated (ai-llm: 0 task) | Thẻ dashed, không link/ link teaser. |

**Chip số chặng/task — 2 cách (hỏi thầy):**
- **(C1) Curated** "20 · 100" trong config (đơn giản, đúng hiện tại, 0 việc BE). Rủi ro drift nếu content đổi (thấp).
- **(C2) BE public field**: thêm `@ResolveField milestoneCount`/`taskCount` (COUNT rẻ) vào `CourseResolver` (đã public) → chip tự cập nhật, self-healing. +1 ít việc BE.
- Đề xuất: **C1 trước** (ship nhanh, đúng), nâng C2 sau nếu muốn số tự động.

## Cắt / Thêm
- **CẮT:** 6 system giả (`LANDING_SYSTEM_KEYS`/`FLOWS`/i18n `landing.systems.items.*`) + 2 mục không có thật (wallet/rideHailing/newsfeed/flashSale).
- **THÊM:** config 4 capstone (keyed displayId) + link→khóa + trạng thái coming-soon + chip độ sâu. Header section đổi số liệu: eyebrow/intro nhấn "4 hệ thống · 300+ task" (thật).
- **State:** `courses` fail → vẫn render thẻ từ curated config (mất link/chip, section vẫn đứng — section này editorial-safe, KHÁC StatStrip "ẩn khi rỗng"). Coming-soon = empty-state có chủ đích.

## Ref
- Bootcamp/landing "what you build / projects": Boot.dev (project cards → course), Educative "what you'll build". Pattern thẻ-capstone-bấm-được là chuẩn ngành.
- Rules nội bộ: [[design-for-data-that-exists-coverless-lowvolume]] (thiết kế theo data CÓ THẬT, ít item → anchor), [[item-card-meta-inside-bounded-object]] (capstone = 1 bounded object, meta trong thẻ), [[course-home-no-duplicate-surfaces]] (đừng vanity).

→ Thầy chọn hướng (mặc định C) + chốt C1/C2 → `/starci-fe-ux-apply` để dựng.
