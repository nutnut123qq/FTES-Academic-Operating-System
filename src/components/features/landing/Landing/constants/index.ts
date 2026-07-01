/** Vòng học 4 bước (read → grade → capstone → rank) — keys map to `landing.learnLoop.items.{key}.*`. */
export const LANDING_LOOP_STEPS = [
    "read",
    "grade",
    "capstone",
    "rank",
] as const

/** Mastery tracks shown on the roadmap — the 3 REAL courses (keys map to
 * `landing.roadmap.tracks.{key}.*`). Grounded: no "security"/"architect" course exists. */
export const LANDING_TRACK_KEYS = [
    "fullstack",
    "systemDesign",
    "devops",
] as const

/** Real systems built across the curriculum (capstones) — keys map to
 * `landing.systems.items.{key}.{name,badge}`. Curated highlight of the SD capstones
 * (proof of "build real systems, not CRUD"). Trimmed to 6 most representative. */
export const LANDING_SYSTEM_KEYS = [
    "newsfeed",
    "flashSale",
    "wallet",
    "rideHailing",
    "chat",
    "deploy",
] as const

/** Representative architecture flow per system (coded mini-diagram nodes; technical
 * terms kept in English — same in vi/en). Keyed by {@link LANDING_SYSTEM_KEYS}. */
export const LANDING_SYSTEM_FLOWS: Record<(typeof LANDING_SYSTEM_KEYS)[number], ReadonlyArray<string>> = {
    newsfeed: ["Client", "Fanout", "Cache", "DB"],
    flashSale: ["Client", "Queue", "Inventory", "DB"],
    wallet: ["API", "Ledger", "Saga", "DB"],
    rideHailing: ["GPS", "Geo-index", "Match", "Surge"],
    chat: ["WS", "Gateway", "Queue", "Store"],
    deploy: ["Git", "CI", "Registry", "K8s"],
}

/** Short course tag per track (shown on the right of each treasure topic row). */
export const LANDING_TRACK_TAG: Record<(typeof LANDING_COURSE_TRACKS)[number], string> = {
    fullstack: "FS",
    systemDesign: "SD",
    devops: "DO",
}

/**
 * "Kho tàng" — curated trophy lesson topics rút TỪ content thật (verifiable lesson
 * titles), chia 2 làn: `code` (thuật toán/pattern bạn viết) vs `infra` (hệ thống/vận
 * hành). `label` = tên bài kỹ thuật (giữ English, same vi/en như các node khác);
 * `track` = khóa chứa bài → dùng để gắn tag + link "Vào khóa" (course thật).
 * Nguồn: CONTENT-TREASURE-UX-BRAINSTORM.md (đào `.mount/data/courses/*`).
 */
export const LANDING_TREASURE_TOPICS: Record<
    "code" | "infra",
    ReadonlyArray<{ id: string; label: string; track: (typeof LANDING_COURSE_TRACKS)[number] }>
> = {
    code: [
        { id: "redlock", label: "Redlock & Fencing Token", track: "systemDesign" },
        { id: "sagaChoreography", label: "2PC vs Saga choreography", track: "systemDesign" },
        { id: "tokenBucket", label: "Token bucket + Redis Lua", track: "systemDesign" },
        { id: "kafkaEoS", label: "Kafka exactly-once", track: "systemDesign" },
        { id: "ragPgvector", label: "RAG + pgvector", track: "fullstack" },
        { id: "webhookIdempotency", label: "Webhook idempotency & refund", track: "fullstack" },
    ],
    infra: [
        { id: "k8sControlPlane", label: "K8s control plane (etcd/apiserver)", track: "devops" },
        { id: "argoCanary", label: "Argo Rollouts canary", track: "devops" },
        { id: "slsaSigstore", label: "SLSA & Sigstore supply-chain", track: "devops" },
        { id: "falco", label: "Falco runtime security", track: "devops" },
        { id: "otelJaeger", label: "OpenTelemetry / Jaeger tracing", track: "systemDesign" },
        { id: "terraformMultiCloud", label: "Terraform multi-cloud", track: "devops" },
    ],
}

/** Founder expertise chips — keys map to `landing.founder.expertise.{key}`. */
export const LANDING_FOUNDER_EXPERTISE = [
    "systemDesign",
    "blockchain",
    "aiAutomation",
] as const

/**
 * Public-repo count on the GitHub org (`StarCi-Academy`) — the one verifiable
 * "build in the open" proof in the founder beat. Static figure (no BE field):
 * update manually, or wire `api.github.com/orgs/StarCi-Academy`.public_repos.
 */
export const FOUNDER_PUBLIC_REPOS = 242

/** Raw-truth rows in the founder beat — content at
 * `landing.founder.truth{n}` (the blunt truth) / `landing.founder.fix{n}` (our answer). */
export const LANDING_FOUNDER_TRUTH_INDEXES = [1, 2, 3, 4] as const

/** FAQ rows — content lives at `landing.faq.q{n}` / `landing.faq.a{n}`. */
export const LANDING_FAQ_INDEXES = [1, 2, 3, 4, 5] as const

/**
 * Language strip under the hero CTAs (challenges are AI-graded in any of these).
 * Each carries its official brand colour as a `bg-[hex]/10 text-[hex]` tint (literal
 * Tailwind classes so they're picked up at build) — the strip reads alive, not muted,
 * and a dev recognises the language by its colour at a glance. Not translated.
 */
export const LANDING_HERO_KEYWORDS = [
    { label: "TypeScript", className: "bg-[#3178C6]/10 text-[#3178C6]" },
    { label: "Java", className: "bg-[#E76F00]/10 text-[#E76F00]" },
    { label: "C#", className: "bg-[#8B5CF6]/10 text-[#8B5CF6]" },
    { label: "Go", className: "bg-[#00ADD8]/10 text-[#00ADD8]" },
] as const

/** Featured tracks on the landing — the 3 flagship courses (others users search on
 * the catalog). Keys map to `landing.courses.items.{key}.{tag,title,desc,modules}`. */
export const LANDING_COURSE_TRACKS = [
    "fullstack",
    "systemDesign",
    "devops",
] as const

/** Mỗi track = 1 khóa THẬT. displayId/slug khóa để link "Vào khóa" → trang course detail
 * (`/courses/<slug>`). Grounded: slug khớp course thật trong DB. */
export const LANDING_TRACK_COURSE_SLUG: Record<(typeof LANDING_COURSE_TRACKS)[number], string> = {
    fullstack: "fullstack-mastery",
    systemDesign: "system-design-mastery",
    devops: "devops-mastery",
}

/** 4 tier (FOUNDATION → INTERMEDIATE → ADVANCED → APPLICATION) cho mỗi lộ trình — hiển thị
 * dạng cột dọc trong section Roadmap. label = nhãn tầng sentence-case (đồng bộ design-system,
 * no-uppercase). topic = tóm tắt nội dung tiếng Anh kỹ thuật. */
export const LANDING_ROADMAP_TIERS: Record<
    (typeof LANDING_TRACK_KEYS)[number],
    ReadonlyArray<{ label: string; topic: string }>
> = {
    fullstack: [
        { label: "Foundation",    topic: "HTTP, REST, data modeling" },
        { label: "Intermediate",  topic: "Auth, caching, background jobs" },
        { label: "Advanced",      topic: "Queues, websockets, rate limits" },
        { label: "Application",   topic: "Deploy, observability, payments" },
    ],
    systemDesign: [
        { label: "Foundation",    topic: "Latency, throughput, CAP" },
        { label: "Intermediate",  topic: "Sharding, replication, indexes" },
        { label: "Advanced",      topic: "Consensus, idempotency, sagas" },
        { label: "Application",   topic: "Real systems end-to-end" },
    ],
    devops: [
        { label: "Foundation",    topic: "Linux, containers, networking" },
        { label: "Intermediate",  topic: "CI/CD, IaC, secrets" },
        { label: "Advanced",      topic: "Kubernetes, autoscaling, SLOs" },
        { label: "Application",   topic: "Progressive delivery, DR" },
    ],
}

/**
 * Static sample candidate shown in the talent-marketplace beat — an illustrative
 * "engineer profile" mockup (like a product screenshot), NOT a real user. Numbers
 * are representative of what a learner earns by finishing the work. Skill names are
 * proper nouns (not translated); labels come from `landing.outcome.card.*`.
 */
export const LANDING_SAMPLE_CANDIDATE = {
    name: "Thảo Vân",
    /** Profile slug (address-bar of the mockup). */
    slug: "thao-van",
    /** Avatar ảnh thật (lưu ở public/landing/thao-van.jpg). */
    avatarUrl: "/landing/thao-van.jpg",
    skills: ["TypeScript", "Go", "System Design"],
    xp: 4820,
    cvScore: 87,
    challengeCount: 12,
    challengeAvg: 84,
} as const
