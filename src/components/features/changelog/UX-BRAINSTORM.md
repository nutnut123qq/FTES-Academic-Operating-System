# UX Brainstorm — Trang "Có gì mới" (Changelog) tách riêng + "System health"

> Thầy: "có gì mới tách ra 1 trang luôn, kiểu system healthy nữa". Hiện Changelog nhúng trong dashboard
> Community tab (`ChangelogList`), không có route riêng. KHÔNG code.

## Dữ liệu thật (grounded)
- **Changelog CÓ THẬT**: `changelogEntries(limit)` → `{ id, title, body(markdown), category(feature|fix|announcement|null),
  publishedAt, linkUrl }`. Entity `changelog_entries` (slug, title/body jsonb song ngữ, isPublished, publishedAt).
  Seed từ `.mount/data/changelog/changelog.md`. **Cap limit 20, KHÔNG offset/cursor** (chưa "xem hết" được).
  Render hiện: `ChangelogList` trong `CommunityTab` (`/dashboard`), không route riêng, không permalink/entry.
- **System health — KHÔNG có data thật cho trang công khai.** Chỉ có `aiBalancerHealth` (query system, **admin-gated**
  `/admin/tools/ai-balancer`): sức khoẻ **key pool AI** (active/disabled/failCount per key) — KHÔNG phải "service up/down".
  **KHÔNG tồn tại**: uptime/SLA, incident, `/health` API, queue/worker status, DB/Redis/Minio/Keycloak/Judge0 status.
  → **Không vẽ status page bằng data fake.**

## Mục tiêu
"Có gì mới ở StarCi" + (tham vọng) "hệ thống đang ổn không" — trang công khai, chia sẻ được, recruiter/learner xem nhanh.

## Hướng (≥3)

### Hướng A ⭐ — Tách `/changelog` (release notes thật), HOÃN status
- Route công khai mới `/[locale]/changelog` (không cần auth — changelog public). Reuse `changelogEntries`.
- IA: PageHeader "Có gì mới" + **filter category** (Tất cả/Tính năng/Sửa lỗi/Thông báo) + **timeline gom theo ngày/tháng**;
  mỗi entry = ngày + chip category + title + **body markdown** (render `MarkdownContent`) + `linkUrl` (Link "Chi tiết").
- **Xem hết = infinite scroll** → **CẦN BE**: `changelogEntries` thêm `offset` (hoặc cursor) + nới cap (giống saved-contents
  đã có skip/take). FE `useSWRInfinite`.
- Community tab: `ChangelogList` rút còn **3–4 mục mới nhất + "Xem tất cả" → /changelog** (Link).
- **System health**: HOÃN — nêu rõ cần BE (xem Hướng B); KHÔNG fake.
- ✅ Toàn bộ là data thật, build được ngay (trừ offset BE nhỏ). **Khuyến nghị.**

### Hướng B — `/status` = Changelog + Health (cần BE health-aggregator THẬT)
Trang `/status` 2 phần: (1) "Tình trạng hệ thống" + (2) "Có gì mới".
- Phần health cần **BE MỚI**: 1 query `systemHealth` ping các service core (Postgres/Redis/Minio/Keycloak/Judge0/Kafka/queue)
  → trả `[{ service, status: operational|degraded|down, checkedAt }]` (+ optional incident model). KHÔNG có sẵn → đây là
  **feature BE thật**, không fake. (AI-balancer health admin hiện có thể nhúng cho admin, nhưng không phải status công khai.)
- ✅ Đúng "kiểu system healthy"; ⚠️ NẶNG (cả module health-check BE + có thể incident/uptime store). Làm sau khi thầy chốt scope.

### Hướng C — Minimal: chỉ route hoá ChangelogList hiện tại
Bê nguyên `ChangelogList` sang 1 route `/changelog`, không filter/infinite/markdown.
- ✅ Nhanh; ⚠️ vẫn cap 20, không "xem hết", bỏ phí (body markdown/permalink).

## CHỐT: Hướng A (build ngay) + Hướng B = PLAN cần thầy duyệt scope
Changelog là data thật → tách `/changelog` đầy đủ (filter + timeline + markdown + infinite) là thắng chắc. "System health"
KHÔNG có data → **không gộp fake**; nếu thầy muốn, mở **feature BE `systemHealth`** riêng (ping service → operational/degraded/down)
rồi mới dựng `/status`. Trước mắt: `/changelog` thật + cross-link từ community tab.

## Section → dữ liệu (+ gap)
| Phần | Nguồn | Trạng thái |
|---|---|---|
| Changelog feed | `changelogEntries` (title/body md/category/publishedAt/linkUrl) | ✅ có |
| Filter category | `category` enum | ✅ client |
| Xem hết (infinite) | `changelogEntries(offset/cursor)` | ⚠️ **CẦN BE** thêm offset + nới cap |
| Community tab teaser | `changelogEntries(limit:3)` + Link "/changelog" | ✅ |
| System health | — | ❌ **KHÔNG có** → cần BE `systemHealth` (Hướng B, plan) |

## States / a11y
- AsyncContent: skeleton timeline rows · empty "Chưa có cập nhật" · error retry. Category filter = Select/chip.
- Trang public → SSR-friendly (changelog tốt cho SEO; cân nhắc generateMetadata).

---
*→ Thầy duyệt: (A) dựng `/changelog` ngay (FE + BE offset nhỏ) · (B) nếu muốn status page → chốt scope `systemHealth`
BE trước. Draft rule khi apply: "trang public list (changelog) = route riêng + infinite + teaser ở nơi nhúng cũ;
KHÔNG dựng status/health bằng data fake — thiếu data thì mở feature BE, không bịa".*
