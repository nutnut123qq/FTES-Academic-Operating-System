# KnowledgeGraph — section "Kho tàng" as a live knowledge graph (2026-06-26)

Thầy: *"render cái graph như Qdrant dashboard, kiến thức lồng ghép với nhau; đọc contents để vẽ; có lib nào đẹp như Qdrant không"*.

## Lib research
- **Qdrant web-ui** (open-source) Graph Network Visualization = force-directed; dùng **`force-graph` ^1.43.5** (vasturiano; wrapper React = `react-force-graph-2d`, canvas/WebGL). Nodes = points, edges = similarity, force layout real-time.
- Repo **đã có `@xyflow/react`** (mind-map dùng) + css import sẵn ở `globals.css`.
- Options cân nhắc: react-force-graph (đúng lib Qdrant, canvas, dep mới, khó theme token) · sigma.js/ReaGraph (WebGL, overkill) · @xyflow + d3-force (reuse dep, node = React component → brand-perfect) · SVG+framer thuần (nhẹ nhất, tự lo layout).

## Hướng CHỐT (thầy duyệt) — B + live physics
- **`@xyflow/react` (đã có) + `d3-force`** (engine layout — dep nhỏ, layout-only, KHÔNG phải lib render nặng). Node = React component glow theo màu track; **live force** (charge + link + collide + forceX anchor theo track) → 3 cụm track lỏng vẫn nối chéo; **kéo node + zoom/pan** như Qdrant.
- KHÔNG dùng react-force-graph (canvas khó theme brand + dep mới). KHÔNG static (thầy chọn live physics).

## Data grounded (Explore đào `.mount/data/courses`)
- 3 khóa thật: fullstack-mastery (23 mod) · system-design-mastery (24 mod/20 capstone) · devops-mastery (35 mod). Structure: course → modules/<n-slug>/contents/<n-lesson> + milestones + flashcard-decks.
- **26 node** = concept THẬT (CAP, Sharding, Saga, Idempotency, Redlock, Kafka, CDC/Debezium, Token bucket, WebSocket gateway, Distributed tracing · NestJS, TypeORM, Webhooks, Payment, RAG/pgvector, OAuth, Background jobs, React RSC · K8s, Ingress, ArgoCD, Argo Rollouts, Prometheus, RBAC, Terraform, Falco). Tag theo track (FS/SD/DevOps).
- **31 edge**: builds-on trong track + **7 cross-track** ("lồng ghép": Idempotency↔Webhooks/Payment · CDC↔TypeORM · Kafka↔Jobs · Prometheus↔Tracing · OAuth↔RBAC · Rollouts↔Tracing).
- Node label = English technical (proper noun, same vi/en — không i18n). Click node → khóa của track đó (grounded).

## Đã dựng
- `KnowledgeGraph/data.ts` (TRACK_CONFIG glow/anchor + 26 node + 31 edge) · `ConceptNode.tsx` (pill glow + dot màu track, handle center → edge nối tâm) · `index.tsx` (ReactFlow + d3-force live: tick→writeBack positions, drag pin fx/fy + reheat, zoom/pan, colorMode theo theme, hideAttribution, reduced-motion → settle tĩnh, fitView sau khi spread).
- Landing treasure section: `TreasureBubbles` → `KnowledgeGraph`. dep `d3-force` + `@types/d3-force`.

## Nợ / follow-up
- `TreasureBubbles` + block `TopicBubbles` + `LANDING_TREASURE_TOPICS` giờ mồ côi (graph thay) → xoá khi dọn (giữ tạm phòng thầy muốn quay lại).
- Optional polish: hover node → highlight node+edge liên quan (dim còn lại) · tooltip "là gì/vì sao khó" per node (cần i18n copy) · legend 3 track màu · glow đậm hơn (drop-shadow filter).
- Verify mắt: HMR — node spread thành 3 cụm, kéo được, zoom, click → course. Chưa runtime-test trên dark/light + mobile (touch drag).
