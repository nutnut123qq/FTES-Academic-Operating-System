# Hero Architecture Diagram — UX Brainstorm (2026-06-26)

> Block `blocks/marketing/MicroservicesDiagram` (landing hero, bên phải). Thầy: *"sửa lại theo mục đích business… sơ đồ phức tạp hơn, đọc kiến trúc StarCi backend mà vẽ"*.

## Mục tiêu (business)
Landing định vị *"Build real systems — beyond CRUD"* (System Design · DevOps). Hero diagram = **bằng chứng trực quan** "đây là hệ thống THẬT, phức tạp, bạn sẽ học để tự dựng". Hiện tại = demo generic `order-service.v2` (Client→LB→API→Auth/Order/Payment→PG/Redis/Kafka) — **không grounded, không phải StarCi**. Đổi thành **kiến trúc StarCi backend thật** → authentic + ấn tượng + đúng "spot where it breaks".

## Kiến trúc StarCi backend THẬT (grounded — Explore agent map `starci-academy-backend`)
- **Clients:** Web (Next.js) · Mobile.
- **Edge:** GraphQL API (Apollo, monolithic schema) + **CQRS** (CommandBus/QueryBus) · **Keycloak** OIDC (IdP Google/GitHub).
- **Core domains** (`src/modules/bussiness/*`): courses/enroll · challenges + **AI grading** · payments · gamification (XP/leaderboard/achievements/streak) · flashcards · personal-project · community/chat.
- **5 data stores:** **Postgres** (OLTP source-of-truth, TypeORM) · **Redis** (cache · BullMQ queue · throttle · socket adapter) · **MinIO** (S3 content/assets, presigned) · **Elasticsearch** (content search V2) · **Qdrant** (vector/RAG embeddings).
- **Async spine (đỉnh SD):** Postgres WAL → **Debezium CDC** → **Kafka** (topics `user_contents`/`…_attempts`/`enrollments`) → **Projection listeners** → read-model tables (`user_course_progress_projections`, `user_xp_projections`, leaderboard…). + **BullMQ** jobs (ProcessGitSubmission…) + **NATS** JetStream (job status → WebSocket).
- **AI grading pipeline:** submit → BullMQ → **clone GitHub repo** (per-enrollment encrypted token / org PAT) → chunk + RAG (Qdrant) → **AI balancer** (OpenAI/Gemini/**BYOK**, fallback chain + key rotation) → score → XP → CDC → leaderboard.
- **External:** LLM (OpenAI · Gemini · BYOK) · Payment (PayOS · Sepay · Stripe · PayPal · Crypto/Solana) · GitHub (OAuth + clone) · **Judge0** sandbox · Mailer.
- **Failure/scaling THẬT** (dạy trong SD): **CDC lag → stale read** (cache TTL self-heal) · **LLM rate-limit → balancer failover** · **hot partition** (`*_attempts` write-hot) · **cache stampede** (advisory lock) · **missed webhook → reconcile poll** (PayOS/Sepay) · **Kafka down → projections stale** (best-effort boot).

## IA diagram mới (grounded)
Window title `order-service.v2` → **`starci-academy · platform.prod`** (hệ thống của chính StarCi). Layered:
1. **Clients:** Web (Next.js) · Mobile.
2. **Edge:** GraphQL API (Apollo·CQRS — accent focal) · Keycloak (OIDC).
3. **Core:** Courses · AI Grading (accent) · Payments · Gamify.
4. **Stores (5):** Postgres (source) · Redis (cache·queue) · MinIO (assets) · Elastic (search) · Qdrant (vector·RAG).
5. **Async spine:** Postgres → Debezium CDC → Kafka → **Projections** (read-model) — strip riêng, kể chuyện eventual consistency.
6. **External:** LLM (GPT·Gemini) · Pay (PayOS·Sepay) · GitHub (clone repo) · Judge0 (sandbox).
7. **Failures (4, thật):** CDC lag → stale read · LLM rate-limit → failover · hot partition → throttle · missed webhook → reconcile.
8. **Caption:** "Đây là hệ thống thật của StarCi. Bạn sẽ học để tự dựng nó." (thay "Spot where it breaks" — mạnh hơn về business: authentic + aspirational). Hoặc giữ cả 2 dòng.

## Hướng (chốt A)
- **A — Full topology (ĐỀ XUẤT):** ~16 node, 4 tier + spine CDC + external + 4 failure. "Phức tạp hơn" đúng ý thầy + grounded 100%. Trade-off: nhiều node → cần mono nhỏ + spacing chặt để legible.
- **B — CDC story (1 concept):** chỉ write→CDC→read split (~6 node). Gọn, dạy 1 concept đỉnh. Trade-off: ít "wow phức tạp".
→ **Chốt A** (thầy muốn phức tạp hơn). Có thể nhúng "câu chuyện" của B vào trong A bằng cách làm spine CDC nổi bật (accent ở Projections).

## Section → data (block props/data-driven)
| Phần diagram | Nguồn (curated constant, KHÔNG live) |
|---|---|
| Tiers + nodes | Hằng số trong block (marketing illustration) — rút từ kiến trúc thật BE |
| Spine CDC | Debezium → Kafka → projection (thật, `progress-projection.listener`) |
| External | LLM/pay/GitHub/Judge0 (thật) |
| Failures | 4 điểm thật (CDC lag · LLM rate-limit · hot partition · webhook) |
| Số liệu hero (7·343·4·12 / 12.4k·180·640·20) | StatStrip riêng — KHÔNG đụng |

## Cắt / Thêm
- **Cắt:** `order-service.v2`, Load Balancer/Order/gRPC generic (không phải StarCi).
- **Thêm:** spine CDC→Kafka→Projection · 5 stores thật · external (LLM/pay/GitHub/Judge0) · failures thật · title StarCi.
- a11y: mỗi node mono label đọc được; failures có icon ⚠ + text; diagram `aria-label` mô tả "StarCi platform architecture".

## Impl note (apply)
- Block `MicroservicesDiagram` đổi `TIERS` + `FAILURES` constant + title; thêm 1 layer "spine" (horizontal) + "external" (horizontal) ngoài TIERS dọc. Giữ window chrome + caption prop (i18n). Pure CSS, mono. Mobile: tiers wrap, spine scroll-x nếu chật.
- Mockup: widget `starci_hero_architecture_diagram_redesign` (A full = đề xuất; B CDC-story = alt).

## v2 POLISH (2026-06-26) — giữ hình gốc, đẹp màu + float annotation + framer-motion
> Thầy: *"chips Self-study/ngôn ngữ sượng · bên phải màu không đẹp · scan web màu+concept đẹp · dùng framer motion · sync-call float như v0"*. Web ref: Vercel blueprint aesthetic (dot-grid), dark architecture diagram (slate bg + subtle grid + semantic màu per tier + **glow** + JetBrains Mono), dark cần accent **sáng/bão hoà hơn** (blue/pink trên nền trắng washed-out trên dark).

### Diagram màu (fix muddy)
- **Node**: fill BÁN TRONG SUỐT (`bg-foreground/4` ~ rgba white 4%) + border sáng hơn (`border-foreground/12`, 1.5px focal/failure) → hết "muddy" `bg-default` xám đặc.
- **Glow**: node FOCAL (API Gateway) = border accent + `shadow` accent glow; node FAILURE (Payment/Postgres) = border danger(cam) + danger glow. Connector wire = accent glow nhẹ.
- **Semantic tint nhẹ per tier**: data-tier (Redis/Kafka) viền teal nhạt; còn lại neutral. KHÔNG nhiều màu (2-3 ramp — ref IBM/Structurizr dark).
- **Nền window**: dot-grid blueprint (`radial-gradient foreground/5 1px`) — Vercel aesthetic. Window bg sâu hơn surface.
- **Theme-aware**: dùng token (accent/danger/foreground-alpha) → đẹp cả light/dark, KHÔNG hardcode dark.

### Float annotation (thầy: "sync-call float như v0")
- 3 failure chip **position absolute cạnh node liên quan** (KHÔNG hàng dưới): `sync call → cascade` cạnh phải API Gateway · `single DB → bottleneck` cạnh trái Postgres · `spike → overload` cạnh phải Kafka. Chip danger + glow nhẹ.

### Framer-motion (`framer-motion ^12.38` đã có)
- Node **stagger entrance**: `motion.div` initial `{opacity:0,y:8}` → animate `{opacity:1,y:0}`, `staggerChildren` theo tier.
- Annotation **float**: `animate={{ y:[0,-4,0] }}` `transition={{ repeat:Infinity, duration:3, ease:"easeInOut" }}` (mỗi chip lệch delay).
- Focal **glow pulse**: `animate` boxShadow/opacity loop nhẹ.
- Wire flow giữ CSS `wireFlow` (đã có) HOẶC chuyển motion — giữ CSS (nhẹ).
- `prefers-reduced-motion` → tắt float/stagger (a11y).

### Chips "sượng" (HeroBanner)
- **Eyebrow** ("Self-study · Fullstack · System Design · DevOps") hiện `<Chip variant="soft" color="accent">` = pill hồng dài, sượng → **quiet status pill** kiểu Vercel: `rounded-full border border-default bg-surface/60 px-3 py-1` + **chấm accent pulse** (size-1.5) + text `text-xs text-muted` mono. Bớt loud.
- **Keywords ngôn ngữ** (TS·Java·C#·Go) hiện dot-strip thô → **mono tech-tags** đồng đều: mỗi cái `rounded-md border border-default/60 px-2 py-0.5 text-[11px] font-mono text-muted` (ref "integrations/compatibility strip"). Hoặc giữ dot-strip nhưng mono+muted + prefix nhỏ.

### Hướng chốt
- **Giữ topology gốc** (order-service.v2) + áp v2 polish (màu glow + dot-grid + float annotation + framer-motion + chip refine). KHÔNG đụng StarCi-grounded redesign (defer).
- Mockup: widget `starci_hero_diagram_refined_dark_float`.
- Refs: [Evil Martians devtool landing](https://evilmartians.com/chronicles/we-studied-100-devtool-landing-pages-here-is-what-actually-works-in-2025) · [Vercel blueprint aesthetic](https://www.setproduct.com/blog/complete-guide-to-blueprint-grid-design) · [dark architecture diagram generator](https://github.com/Cocoon-AI/architecture-diagram-generator) · [Muzli dark-mode tokens](https://muz.li/blog/dark-mode-design-systems-a-complete-guide-to-patterns-tokens-and-hierarchy/).
