# Blog — UX brainstorm (2026-06-21)

> Re-imagine the `/blog` index (and detail) from data + first principles. Legacy = inventory only.
> NO code in this doc. After thầy picks a direction → `/starci-fe-ux-apply blog`.

## 0. Page & files
- Index route: `src/app/[locale]/blog/page.tsx` → `components/layouts/blog/BlogList`
- Detail route: `src/app/[locale]/blog/[slug]/page.tsx` → `components/layouts/blog/BlogPost`
- Data hooks: `modules/api/graphql/queries/query-blog-posts.ts`, `query-blog-post.ts`, types in `.../types/blog.ts`
- A blog FE already EXISTS (competent but generic). This is a redesign, not greenfield.

## 1. What data REALLY exists (BE/DB — grounded)
Backend repo: `D:\Repositories\starci-academy-backend`. Two public queries, **no mutations**.

### `blogPosts(category?, limit=12, offset=0)` — list
Offset pagination, hard cap 50, **fixed sort `publishedAt DESC`**, optional category filter. Per item:
`id, slug, title, excerpt?, category, coverImageUrl?, readingMinutes?, isPremium, publishedAt`. Body omitted.

### `blogPost(slug)` — detail (optional auth)
`+ body (markdown, locale-resolved), ctaUrl?, ctaLabel?, sourceUrl?, isPremium, isLocked, publishedAt`.
Premium gating: if `isPremium && !member` → body truncated to 600 chars + `isLocked=true`.

### 6 editorial pillars (`BlogCategory`)
`deep-dive` · `build-in-public` · `career` · `ai` · `case-study` · `codebase`.

### Reality checks that MUST shape the design
- **`coverImageUrl` is null on every real seed post.** Schema has it, content doesn't. → design must be **text-first**; use a cover only opportunistically when present, NEVER depend on it.
- **Very few posts** (2 seeded today, both `deep-dive`, both with `ctaUrl` → System Design course). → layout must look intentional at low volume AND scale to 50.
- **No author** relation (team-authored editorial). → no author avatars/bylines (Stripe/Medium pattern is out).
- **No tags, no search, no view counts, no comments.** Only real meta = `category · publishedAt · readingMinutes`.
- **Funnel intent is real:** every post carries `ctaUrl/ctaLabel` → a course. Blog = top-of-funnel SEO → courses.
- **Premium is real:** `isPremium`/`isLocked` paywall (reserved for build-in-public).
- Bilingual vi/en, locale-resolved server-side.

### Unused-but-available opportunities
- `isPremium` is in the LIST payload → can show a subtle "Members" tag on cards (currently underused).
- Detail has `sourceUrl` ("View on GitHub") + `ctaUrl` funnel — make these first-class, not afterthoughts.
- `blogPosts(category=X)` can power a **"More in {pillar}"** related strip on detail (real data, no new BE).

## 2. Legacy inventory (NOT design authority)
- **Index:** header + 7 category chips + 2-col **image-card grid** (MediaCard), `limit:24` hardcoded, no pagination.
- **Detail:** back link + header (chips/title/date/read) + cover + `MarkdownContent` body + members gate + sourceUrl btn + funnel CTA.
- **Pain:** image-card grid with all-null covers → sad empty boxes; 2 cards in a 2-col grid feels thin; no featured/anchor; no pagination/load-more; no related posts; empty state can't tell "no posts yet" from "none in this filter"; long body (~2000w) has no reading aid.

## 3. Refs (web-grounded — no blog ref in memory before this)
- **Vercel blog** — single-column, **text-first, zero cover images**, category tag + 1-line desc per post. Proof a coverless dev blog reads as deliberate. https://vercel.com/blog
- **Stripe blog** — category "departments" each with *View all*; but **image-forward + author photos** (assets we don't have). https://stripe.com/blog
- Smashing / Web Style Guide — typographic hierarchy carries the page when there's no imagery (contrast + whitespace + scale). https://www.smashingmagazine.com/2013/05/typographic-design-patterns-practices-case-study-2013/

## 4. Three directions (see widget mockup)
| Dir | Pattern | Ref | At 2 posts | At 50 posts | Verdict |
|-----|---------|-----|-----------|-------------|---------|
| **A** | Flat chronological text list | Vercel | thin, no anchor | great | runner-up |
| **B** | Pillar departments (section per category + view-all) | Stripe | **5/6 pillars empty → looks broken** | great (SEO) | premature |
| **C** | **Featured lead + typographic list + filter** | Vercel + editorial | intentional, has anchor | great | ✅ **CHỐT** |

### Recommendation: Direction C
A blend that takes Vercel's text-first scannability and adds ONE editorial anchor so the page never feels empty:
- It's the only option that degrades gracefully at today's 2-post volume **and** scales.
- B (pillar hub) is the right *eventual* shape for SEO topic-clusters, but only after each pillar has ≥2–3 posts. Treat it as a v2 once content fills out — not now.

## 5. New information architecture (Direction C)

### Index `/blog`
1. **Header (tier 2, H3)** — "Blog" + one-line subtitle. No breadcrumb (editorial, not `/learn`).
2. **Category filter** — `All` + 6 pillars as a scannable chip row. Re-keys SWR on change. (No counts — BE gives none; don't invent data.)
3. **Featured lead** — newest post (first of the filtered list), large + typographic: pillar/"Latest" eyebrow, serif-ish big title, excerpt, `date · N min`. No image dependency; if `coverImageUrl` present, show it, else pure type.
4. **List** — remaining posts as compact text rows: title (bold) + meta line `pillar · date · min` (+ excerpt 1 line on wider viewports). Optional small "Members" tag when `isPremium`.
5. **Load more** — offset pagination (`offset += limit`), since BE is offset-based. Hidden when returned < limit.
- States: skeleton mirrors lead+list rhythm; empty distinguishes **"no posts yet"** (unfiltered) vs **"nothing in {pillar}"** (filtered, offer "clear filter"); error = retry.

### Detail `/blog/[slug]`
1. Back link → `/blog`.
2. Header: pillar chip + (Members chip if premium), large title, meta `long date · N min`.
3. Optional cover (only if present).
4. **Body** via `MarkdownContent`. Add a thin top **reading-progress bar** (bodies ~2000w). On-this-page TOC = optional/secondary, only if headings exist (reuse lesson `OnThisPage` if cheap; don't over-build).
5. **Premium gate** (when `isLocked`): clear paywall card after the 600-char teaser → CTA to membership.
6. **`sourceUrl`** → "View on GitHub" secondary button (codebase posts).
7. **Funnel CTA** (`ctaUrl`/`ctaLabel`) → related course, prominent at article end (primary).
8. **"More in {pillar}"** — 2–3 related via `blogPosts(category)` minus current. Reinforces pillar + funnel; uses existing query.

## 6. Section → data map
| Section | Source field(s) |
|---------|-----------------|
| Filter chips | `BlogCategory` enum (static 6) |
| Featured lead | first item of `blogPosts` (title, excerpt, category, publishedAt, readingMinutes, coverImageUrl?) |
| List rows | `blogPosts[]` rest (+ `isPremium` → Members tag) |
| Load more | `blogPosts(offset+=limit)` |
| Detail header | `blogPost`: title, category, isPremium, publishedAt, readingMinutes |
| Reading-progress | client scroll over `body` |
| Premium gate | `isLocked` |
| GitHub btn | `sourceUrl` |
| Funnel CTA | `ctaUrl` + `ctaLabel` |
| More-in-pillar | `blogPosts(category=detail.category)` |

## 7. Cut / add
- **Cut:** image-dependent card grid (covers are null) → replace with text-first list; the thin 2-col grid feel.
- **Add:** featured lead anchor; load-more pagination; filter-aware empty state; reading-progress on detail; related "More in pillar"; first-class GitHub + funnel CTAs; subtle Members tag on premium cards.
- **Defer (v2):** Direction B pillar-hub once pillars fill; search; on-this-page TOC if posts get long/structured.

## 8. CHỐT (thầy duyệt 2026-06-21)
- **Featured lead = serif display title** (`var(--font-serif)`) — editorial moment; rest of app stays sans.
- **Pagination = load-more** (bump `offset`), not numbered pages. Lighter, fits early-stage volume.
- **"More in {pillar}" on detail = YES** — related strip via `blogPosts(category)` minus current.
→ Ready for `/starci-fe-ux-apply blog`.

---

# Blog — UX brainstorm vòng 2 (2026-06-27) — REFRAME: blog NÀY = "StarCi backend, mổ xẻ"

> Thầy: *"phần blog này tập trung cho hạ tầng StarCi Academy Backend thôi. Có ý gì hay hơn không?"*
> Vòng 1 (2026-06-21) thiết kế cho 1 "blog học tập generic" với 6 pillar. Data ĐÃ ĐỔI → cần reframe.

## 0. Điều ĐÃ THAY ĐỔI so với vòng 1 (data thật, 2026-06-27)
- Vòng 1: **2 bài seed**, đều `deep-dive`, mơ hồ "blog là gì".
- Nay: **12 bài seed, TẤT CẢ `category = codebase`** — mỗi bài là 1 deep-dive mổ xẻ **chính backend này**:
  Redis→CQRS projection · Kafka vs RabbitMQ · mount markdown→typed DB · **"Start here: tour monorepo"** ·
  GraphQL leaf-module convention · AI multi-provider balancer · RAG Qdrant+LangChain · LLM grading 30/70 ·
  Keycloak + 2-device sessions · Postgres→live notification (CDC) · coding judge Judge0+BullMQ · media ffmpeg/DASH.
- → **Danh tính thật của blog KHÔNG phải "blog" generic. Nó là 1 ẤN PHẨM KỸ THUẬT / SỔ TAY KIẾN TRÚC mã nguồn của StarCi backend** (open-source onboarding + build-in-public). Mỗi bài = 1 worked-example của chính giáo trình System Design mà StarCi bán → đây là **proof mạnh nhất ở top-of-funnel**.

## 1. Pain THẬT của implement hiện tại (Direction C đã dựng)
1. **Filter 6 pillar mà 5 cái RỖNG** (chỉ `codebase` có bài) → đúng anti-pattern [[design-for-data-that-exists-coverless-lowvolume]] (đừng render filter trỏ vào bucket rỗng). Vòng 1 đã loại Direction B vì lý do này, nhưng `CategoryFilter` VẪN show 6 chip.
2. **Tiêu đề "Blog" generic** → bán hớ. Nội dung là kỹ thuật sâu về 1 backend thật, nhưng nhãn đọc như blog marketing.
3. **`sourceUrl` = null** trong khi MỌI bài là "mổ xẻ codebase" → **cơ hội bị bỏ lỡ lớn nhất**. Bài phân tích code mà không link tới code thật = mất hệ số tin cậy. (Cần seed `sourceUrl` BE, hoặc trỏ repo công khai.)
4. **Không có "Start here" anchor** — có sẵn bài *"Start here: tour monorepo"* nhưng chỉ nằm theo newest-first, không được ghim làm điểm vào.
5. **Serif lead vỡ dấu tiếng Việt** (đã biết — [[fe-lint-no-next-img-directive-and-serif-polish]]). Lead phải sans-lớn/blockquote, KHÔNG `font-serif` tới khi có serif-face VN.
6. **Không thấy "quan hệ với hệ thống"** — 12 bài, mỗi bài về 1 subsystem, nhưng trình bày phẳng; liên hệ tới kiến trúc thật (MicroservicesDiagram/KnowledgeGraph trên landing) vô hình.

## 2. Ba hướng (xem widget mockup)
| Dir | Pattern | Ref | Trade-off |
|-----|---------|-----|-----------|
| **A** ✅ | **Ấn phẩm kỹ thuật** — "Start here" ghim + lead + text-list; taxonomy = SUBSYSTEM thật; mỗi bài link source | Cloudflare deep-dive · Stripe Increment · Vercel Eng | Cải tiến thấp-rủi-ro của Direction C; trung thực nhất với data; bỏ filter rỗng |
| **B** | **Build log / nhật ký ship** — timeline đảo ngược, mộc, gutter ngày, nhịp đều | Railway changelog · Linear | Mạnh khi cadence đều; nhưng các bài đây là deep-dive dài (≠ changelog 1-dòng) → hơi gượng |
| **C** | **Bản đồ kiến trúc** — strip hệ thống thật (CQRS/Kafka/RAG/CDC/Auth/Media/Judge0/Mount) → chọn 1 → đọc bài về nó | Supabase · MicroservicesDiagram nội bộ | Khác biệt nhất, neo vào kiến trúc; nhưng nặng + cần map post→system (chưa có field) |

### CHỐT đề xuất: **Hướng A, hấp thụ "systems strip" của C làm TAXONOMY**
- **Vỏ A** (ấn phẩm kỹ thuật): reframe nhãn → eyebrow `ENGINEERING` + title *"Hệ thống StarCi, mổ xẻ"* / *"How we built this backend"* + subtitle "12 bài deep-dive về chính backend này — kiến trúc, đánh đổi, code thật".
- **Thay 6-pillar-filter chết bằng "topics we write about" = SUBSYSTEM thật** (Stripe Increment "themes" framing): CQRS · Kafka · RAG/Qdrant · CDC · Keycloak · Judge0 · Media · Mount — như **nhãn định hướng** (không phải filter trỏ bucket rỗng). Vì mọi bài hiện là `codebase`, **subsystem là trục phân loại có nghĩa**, không phải 6 marketing pillar.
- **Ghim "Start here: tour monorepo"** làm anchor điểm-vào (trên cả featured lead) — biến blog thành sổ tay onboarding.
- **Wire `sourceUrl`** → mỗi bài có "Đọc source ↗" (cần seed BE; nếu repo chưa public → trỏ tour/monorepo). Đây là hệ số tin cậy của "mổ xẻ codebase".
- Giữ nguyên lead + text-list + reading-progress + funnel CTA + more-in-pillar (đã tốt từ vòng 1) — chỉ ĐỔI khung định vị + taxonomy + anchor + source-link.
- Lý do KHÔNG chọn B/C làm chính: B (changelog) sai bản chất (bài là essay dài, không phải ship-note); C (map) đẹp nhưng cần field map post→subsystem chưa tồn tại + nặng → để **v2** khi có nhiều bài + field. A đạt 90% giá trị, rủi ro thấp.

## 3. Taxonomy mới (subsystem, derive từ content — KHÔNG bịa)
- Trục phân loại = **subsystem** (suy từ slug/nội dung), thay 6 pillar generic. Cách triển khai an toàn nhất khi BE chưa có field `system`:
  1. **Tối thiểu (FE-only, làm ngay):** strip "topics we write about" = chuỗi subsystem curated (constant), KHÔNG click-filter (chỉ framing). Không tạo bucket rỗng vì không phải filter.
  2. **Đầy đủ (cần BE):** thêm field `system`/`area` (enum: data-cqrs · messaging · ai-rag · realtime-cdc · auth · media · coding-judge · platform-mount) vào `BlogPost` → filter thật + map post→subsystem. → mở đường cho Hướng C (bản đồ) sau.
- 6-pillar `BlogCategory` GIỮ trong BE (career/case-study/build-in-public… cho tương lai), nhưng **FE chỉ render filter cho category/subsystem CÓ bài** (no dead chips).

## 4. Section → data map (delta so với vòng 1)
| Section mới | Source |
|---|---|
| Eyebrow "ENGINEERING" + title định vị | i18n curated (constant) |
| "Topics we write about" strip | subsystem list curated (FE constant) HOẶC field `system` mới (BE) |
| "Start here" pinned anchor | bài slug `start-here-monorepo-tour` (pin theo slug, fallback newest nếu thiếu) |
| Source-link mỗi row/detail | `sourceUrl` (cần seed BE) |
| Filter (nếu giữ) | chỉ render category/subsystem **có bài** (`blogPosts` non-empty) |

## 5. Cut / add (vòng 2)
- **Cut:** filter 6 pillar với 5 bucket rỗng; nhãn "Blog" generic; serif-lead (dấu VN vỡ → sans-lớn).
- **Add:** định vị "ấn phẩm kỹ thuật / sổ tay backend"; "Start here" ghim; "topics = subsystem thật" strip; "Đọc source ↗" mỗi bài (wire `sourceUrl`); filter chỉ render khi có bài.
- **Defer (v2, cần BE):** field `system`/`area` → filter subsystem thật + Hướng C (bản đồ kiến trúc nối MicroservicesDiagram/KnowledgeGraph); seed `sourceUrl` toàn bộ; build-log lane (Hướng B) nếu mở cadence changelog.

## 6. Việc BE cần (để hướng A trọn vẹn)
1. **Seed `sourceUrl`** cho 12 bài codebase (trỏ file/dir thật trong repo public, hoặc monorepo tour). — quan trọng nhất.
2. (Optional v2) field `system`/`area` trên `BlogPost` + arg `system` cho `blogPosts(...)` → filter subsystem + map cho Hướng C.
→ Thầy chọn hướng (mặc định **A + systems-strip**) → `/starci-fe-ux-apply blog`. Nếu cần `sourceUrl`/`system` → ghi task BE trước.

---

# Blog masthead — 3D live infra scene (CHỐT 2026-06-27: PUBLIC SHOWCASE grounded, an toàn)

> Thầy: *"xúc [Hướng A]... rồi health-check các thành phần StarCi rồi vẽ threejs"* → *"công khai, public"*.
> Đây là Hướng C (bản đồ kiến trúc) đẩy lên **3D + animated**, làm **masthead** của blog "Hệ thống StarCi, mổ xẻ".

## 0. Feasibility (đã research BE + FE, 2026-06-27)
- **BE:** chưa có health module tập trung NHƯNG **13 component đều có status truy vấn được** (Postgres ×2 · Redis ×4 [BullMQ/Throttler/Adapter/Cache] · Kafka · NATS · Qdrant · Elasticsearch · MinIO · DO Spaces · Keycloak · BullMQ · Judge0). Đã có query mẫu **`aiBalancerHealth`** (`features/api/core/graphql/queries/system/ai-balancer-health/`) + pattern SWR `refreshInterval` 10s đang chạy (`useQueryAiBalancerHealthSwr`).
- **FE:** three.js CHƯA cài, nhưng **stub `ArchitectureScene` ĐÃ có** ở Landing (`Landing/index.tsx` `dynamic(() => import("@/components/blocks/marketing/ArchitectureScene"), { ssr:false })`, comment *"Hero architecture diagram in real 3D (WebGL/R3F)"*) — component chưa tồn tại, đang là skeleton. `@xyflow/react` đã cài + chạy (mind-map). `d3-force` chỉ transitive.

## 1. CHỐT (thầy duyệt) — PUBLIC SHOWCASE grounded, KHÔNG leak prod state
- **Public scene = GROUNDED nhưng KHÔNG phơi live up/down/latency THẬT của prod.** Phơi "Kafka down" công khai = lộ trạng thái ops = tín hiệu cho attacker. → public scene: **13 component THẬT + dây nối THẬT + animated "đang sống"** (pulse/packet flow), **luôn đọc operational** (decorative liveness), KHÔNG bind realtime down-state per-component.
- **Live status THẬT (per-component up/down/latency) → CHỈ ở admin** (`/status` hoặc admin tool, gate auth), giống trang `aiBalancer` đang có. KHÔNG công khai.
- **Hệ quả quan trọng:** **public masthead KHÔNG cần BE mới** — topology = constant curated (13 component thật, như cách landing systems-list curated), R3F scene animated. `systemHealthStatus` query CHỈ cần cho admin live → **defer/optional**, KHÔNG block blog hero.

## 2. Tool (theo rule [[marketing-graph-viz-xyflow-d3force-not-new-webgl-lib]])
- **3D wow-hero → R3F/three.js** (ngoại lệ "3D/GPU wow" — đây là 3D thật, không phải node-graph phẳng; LẤP đúng stub `ArchitectureScene` đã intended). Cài `three` + `@react-three/fiber` (+ `@react-three/drei`), `dynamic(ssr:false)` + lazy (bundle ~300–400KB gz → chỉ cho 1 hero, lazy).
- **Browse map 2D (Hướng C blog) → giữ xyflow** (đã cài). KHÔNG kéo three.js vào việc 2D.
- → 3D cho đúng 1 hero; xyflow cho phần duyệt. Không lẫn.

## 3. Nó sống ở đâu (single source)
- **Block dùng chung `blocks/marketing/ArchitectureScene`** (R3F) phục vụ CẢ: (a) **masthead blog** "Hệ thống StarCi, mổ xẻ"; (b) **Landing hero** (lấp stub đã có). 1 block, 2 nơi.
- Scene grounded: 4 tầng từ component thật — **EDGE/API** (GraphQL API · Socket.IO · Keycloak) → **COMPUTE** (BullMQ · Judge0 · AI balancer) → **DATA** (Postgres · Redis ×4 · Qdrant · Elasticsearch · MinIO) → **BUS/CDC** (Kafka · NATS · Debezium). Packet chạy theo dây (giống `wireFlow` keyframe + `MicroservicesDiagram`), pulse "alive".
- (Optional, sau) **admin `/status`**: cùng scene HOẶC xyflow 2D, bind `systemHealthStatus` thật (màu success/warning/danger theo status). Gate admin.

## 4. Section → data
| Phần | Nguồn |
|---|---|
| Topology 13 node + dây | **constant curated** (FE, grounded từ component thật — KHÔNG BE) |
| Pulse/packet "alive" | client animation (R3F), decorative |
| (Admin) status màu thật | `systemHealthStatus` (BE mới, defer) — ping song song 13 component |
| Số liệu phụ (nếu muốn) | `platformStats` (đã có) |

## 5. Việc BE (defer/optional — KHÔNG block public hero)
- **`systemHealthStatus` query** (chỉ cho admin live): ping song song 13 component (Postgres `SELECT 1` · Redis `ping` ×4 · Kafka `admin.listTopics` · NATS ping · Qdrant/ES/MinIO/Keycloak HTTP health · BullMQ `getJobCounts`), trả `{ name, status, latencyMs }[]`. Copy pattern `aiBalancerHealth`. → đã lên task BE (chip), optional.
- **Public hero KHÔNG cần BE** → có thể dựng ngay ở `/starci-fe-ux-apply` (cài three + R3F, topology constant).

## ĐÃ ÁP DỤNG 2026-06-27 (`/starci-fe-ux-apply`, branch `mtp`)
- **Deps:** `three@^0.185 · @react-three/fiber@^9.6 · @react-three/drei@^10.7 · @types/three` đã ở node_modules (phantom) → thêm vào `package.json` + `npm install` (lockfile sync). Việc này cũng SỬA landing hero (trước thiếu dep khai báo).
- **Masthead 3D:** `BlogList/Masthead/{index,scene}.tsx` — tái dùng block `ArchitectureScene` (đã có sẵn, polished) với scene RIÊNG `BACKEND_INFRA_SCENE` (StarCi infra thật, operational, KHÔNG danger/leak). Mount trên đầu `/blog`. Dynamic `ssr:false` + skeleton mirror.
  - **Bài học node-density (verify mắt):** scene 13 node → **label đè nhau loạn** (nhiều node cùng cột spine + board hẹp + zoom thấp). Fix = **curate xuống 10 node trên ĐÚNG board/camera proven của scene gốc** (`cols/rows [-3,3]² · cell 2.4 · camera [10,9,10] zoom 25`) → labels đọc được (center vẫn hơi chật, inherent của component — orbit được). Nguyên tắc: scene flat-iso có label nổi → **giữ số node ~≤10 + reuse layout đã proven**, đừng nhồi đủ 13; "curated" > "đầy đủ". (Media/NATS/MinIO/ES lược bớt khỏi showcase — vẫn nhắc ở topics strip.)
- **Reframe (Hướng A):** i18n `blog.title`→"Hệ thống StarCi, mổ xẻ" + `subtitle` engineering; `TopicsStrip` (subsystem thật, framing không filter); `StartHereAnchor` (ghim slug `start-here-monorepo-tour`, accent, loại khỏi flow); `CategoryFilter` thêm prop `categories` + chỉ render khi ≥2 pillar có bài (giờ ẩn — toàn `codebase`); `font-serif`→sans ở Featured/Detail (sửa vỡ dấu VN); bỏ `uppercase` ở eyebrow "latest" ([[no-uppercase-text]]); `gap-1.5`→`gap-2` PostRow. tsc + eslint sạch, 0 console error.
- **NỢ (pre-existing, NGOÀI scope reframe — flag để pass riêng):** blog **title + excerpt render raw `**markdown**`** (`**Redis cache**`, `**monorepo**`) — field có markdown nhưng render text thô (Featured/PostRow/StartHere/Detail). Cần 1 pass richtext ([[elements/richtext]] §2 inline `[&_p]:m-0 [&_p]:inline`) — đụng cả heading hierarchy nên làm riêng, có verify mắt. KHÔNG sửa trong pass này (tránh scope-creep + risk).
