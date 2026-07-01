# AdminSystemHealth — UX Brainstorm (trang MỚI)

> Trang admin "tình trạng hệ thống": ping các thành phần hạ tầng + trạng thái AI keys. Brainstorm — CHƯA code.
> Grounded từ research BE (`starci-academy-backend`) + FE admin hiện có. 2026-06-28.

## 0. Tên trang (đề xuất)

| Route slug (EN) | Nhãn VI | Ghi chú |
|---|---|---|
| **`system-health`** ✅ | **"Tình trạng hệ thống"** | Rõ nghĩa, khớp `systemHealthStatus` query BE. ĐỀ XUẤT. |
| `status` | "Trạng thái" | Ngắn, khớp ý "admin live /status" trong rule infra-showcase. Hơi chung. |
| `infra` | "Hạ tầng" | Hẹp (chỉ infra), không gói được AI keys. |

→ **Chốt `system-health`** → route `/[locale]/admin/tools/system-health`, component `AdminSystemHealth`. Nhãn UI "Tình trạng hệ thống".

## 1. Mục tiêu trang (≤30s)
Admin mở ra để trả lời 3 câu, theo thứ tự:
1. **Hệ thống có đang ổn không?** → 1 banner tổng "N/M thành phần khỏe".
2. **Cái nào đang chết/chậm?** → grid component, status dot + latency, cái đỏ nổi lên trên.
3. **AI keys còn sống bao nhiêu?** → mỗi provider: active/cooling/disabled + per-key chip.

Cắt vanity: KHÔNG vẽ biểu đồ latency theo thời gian (BE **không có** time-series — chỉ ping tức thời). Chỉ hiện snapshot + last-checked.

## 2. Phát hiện quan trọng khi research

### 2a. ⚠️ Bảo mật — `aiBalancerHealth` ĐANG PUBLIC (no guard)
- `src/features/api/core/graphql/queries/system/ai-balancer-health/ai-balancer-health.resolver.ts` — query `aiBalancerHealth` chỉ có `ThrottlerConfig.Soft`, **KHÔNG có guard** → bất kỳ ai cũng query được trạng thái key (suffix/failCount/disabled). Vi phạm rule `engineering-blog-...-no-prod-leak.md` Luật 2 (key status = tín hiệu attacker).
- **Phải fix trong scope này:** thêm GraphQL admin guard + áp cho CẢ query mới LẪN `aiBalancerHealth` cũ.

### 2b. Hạ tầng BE đã có sẵn ~60%
- **AI keys:** `AiBalancerService.healthSnapshot()` → `{ providers: [{ provider, keysFilePath, totalKeys, activeKeys, disabledKeys, keys: [{ keySuffix, status, failCount, lastUsedAt, lastHealthCheckAt, disabledAt }] }] }`. **Dùng thẳng.** (Nối tiếp refactor key-store: mỗi model 1 `keysFilePath` → group key theo file/model hiển thị đẹp.)
- **Boot readiness:** `ReadinessWatcherFactoryService.getStatus()` → `Record<name, "pending"|"ready"|"error">`. Nhưng CHỈ `MountStorageService` + `ElasticsearchService` đăng ký watcher → **không đủ** cho 10 component (đây là readiness lúc BOOT, không phải liveness runtime).
- **Per-component liveness (judge0/minio/nats/kafka/pg/redis/keycloak/qdrant/es/ollama):** **CHƯA có** — nhưng mỗi client có sẵn 1 call rẻ để ping (xem bảng §4). Cần viết `SystemHealthService`.

### 2c. FE admin hiện có (để mirror)
- `/admin` = `AdminLogin` (nhập apiKey → Redux `state.admin.apiKey`); mỗi trang tự check apiKey → redirect. **KHÔNG có middleware, KHÔNG có admin shell chung.**
- `/admin/tools/ai-balancer` = `AdminAiBalancer` — chính là "trang con" của cái ta đang làm. Dark gradient + max-w-5xl + TopBar (back + tool switcher) + refresh 10s.
- **Tái dùng:** `useQueryAiBalancerHealthSwr` (pattern poll), `KeyStatusChip` + `AI_BALANCER_KEY_STATUS_DARK_MAP` (emerald/rose/amber + icon), `StatusChip` block, skeleton pattern.

## 3. Information architecture (hướng chốt)

```
TopBar  [← back]                      [tool switcher: ai-balancer | system-health | upload-video …]
─────────────────────────────────────────────────────────────────
Tiêu đề  "Tình trạng hệ thống"            cập nhật {time} · [Làm mới]
─────────────────────────────────────────────────────────────────
[ Banner tổng ]  ● 9/11 khỏe   ·   2 lỗi   (xanh nếu all-up, đỏ nếu có down)
─────────────────────────────────────────────────────────────────
HẠ TẦNG  (grid component card)
 ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
 │ ● Postgres  │ │ ● Redis     │ │ ● MinIO     │   ← status dot + tên
 │ up · 12ms   │ │ up · 3ms    │ │ down · —    │   ← latency / last-checked
 └─────────────┘ └─────────────┘ └─────────────┘
 (Judge0 · NATS · Kafka · Keycloak · Qdrant · Elasticsearch · Qwen/Ollama)
─────────────────────────────────────────────────────────────────
AI KEYS & MODELS   (per provider, reuse AdminAiBalancer/ProviderSection)
 OpenAI   12 keys · 11 active · 1 disabled   [chip] [chip] [chip]…
 Gemini    5 keys ·  5 active                [chip]…
 Local      1 key  ·  active                 [chip]
```

- **Component down → đẩy lên đầu grid** (cái cần xử lý nổi trước).
- **AI keys** = section dưới, tái dùng nguyên `ProviderSection` của AdminAiBalancer (đã có), chỉ đổi nguồn data sang `systemHealthStatus.ai`.

## 4. Section → dữ liệu BE (grounded)

| Section | Field BE | Nguồn | Có sẵn? |
|---|---|---|---|
| Banner tổng | đếm từ infra[] | tính ở resolver | mới |
| Infra card | `{ component, status: up\|down\|degraded, latencyMs, message, checkedAt }` | `SystemHealthService.check()` (MỚI) | ❌ viết mới |
| AI keys | `providers[].{ totalKeys, activeKeys, disabledKeys, keys[] }` | `AiBalancerService.healthSnapshot()` | ✅ dùng thẳng |
| Boot readiness (optional) | `getStatus()` map | `ReadinessWatcherFactoryService` | ✅ (phụ) |

### Liveness call rẻ cho từng component (cheapest ping)
| Component | Call | Client có sẵn |
|---|---|---|
| Postgres | `dataSource.query("SELECT 1")` | `@InjectDataSource(POSTGRESQL_PRIMARY)` |
| Redis | `client.ping()` | ioredis (4 instance, ping Cache là đủ) |
| Elasticsearch | `client.ping()` | `@elastic/elasticsearch` |
| MinIO/S3 | `ListBucketsCommand` / `HeadBucket` | `src/modules/s3` |
| Qdrant | `client.getCollections()` | `@qdrant/qdrant-js` |
| Kafka | `admin().connect()` rồi disconnect | kafkajs |
| NATS | `connection.isClosed` / `serverInfo` | nats lib |
| Keycloak | `GET /realms/{realm}` (public) | axios `KEYCLOAK_URL` |
| Judge0 | `GET /about` | fetch `JUDGE0_BASE_URL` |
| Qwen/Ollama | `GET /v1/models` (hoặc `/api/tags`) | `OLLAMA_BASE_URL` |

## 5. BE TASK đi kèm (phải làm trước/cùng FE)
1. **`GraphQLAdminAccessGuard`** (`x-admin-api-key` header → so với `MountStorageService.adminApiKey`) — GraphQL chưa có guard admin nào.
2. **`SystemHealthService`** — ping 10 component song song (`Promise.allSettled`), timeout ngắn (~2s/component), cache kết quả ~5s (tránh hammer khi poll 10s). Trả `{ component, status, latencyMs, message, checkedAt }[]`.
3. **`systemHealthStatus` resolver** (gated) = infra[] (từ #2) + ai (reuse `healthSnapshot()`) + readiness (optional).
4. **Retrofit guard cho `aiBalancerHealth`** (fix leak 2a).
5. **FE:** gắn `x-admin-api-key` (Redux) vào header request GraphQL cho query admin (hiện balancer public nên FE chưa gửi key).

## 6. 2 hướng đã cân nhắc
- **A — Overview cards (CHỐT):** banner + grid infra + section AI keys. Khớp AdminAiBalancer sẵn có, build nhanh, grounded (chỉ snapshot). Ref: BetterStack/Better Uptime internal board, Atlassian Statuspage, Vercel status.
- **B — Dense status board + drill-down drawer:** lưới chấm dày (kiểu Grafana/K8s Lens), click → drawer chi tiết (latency history/error). **Bỏ:** cần time-series + per-component history mà BE KHÔNG có → sẽ phải bịa data (vi phạm grounded-in-data). Để dành khi BE có metrics thật.

## 7. Cắt / thêm
- **Cắt:** biểu đồ latency theo thời gian, uptime %, alert history (không có data).
- **Thêm (rẻ, có data):** banner tổng, sort down-first, last-checked relative time, nút "Làm mới" + poll 10s, reuse KeyStatusChip.
- **Empty/error/loading:** skeleton mirror grid (mirror AdminAiBalancerSkeleton); component lỗi ping → card `down` + message (KHÔNG ẩn).

## Refs
- In-repo: `AdminAiBalancer` (pattern), rule `engineering-blog-...-no-prod-leak.md` Luật 2 (gate admin).
- Ngoài: BetterStack/Better Uptime, Atlassian Statuspage, Vercel Status, Grafana, Kubernetes Lens (internal ops health board).
