import type { ArchitectureSceneData } from "@/components/blocks/marketing/ArchitectureScene/types"

/**
 * Public, operational showcase of StarCi's REAL backend — the masthead of the engineering blog
 * ("the StarCi backend, taken apart"). A CURATED set of 10 real components (Client → API gateway →
 * core API, with Keycloak / AI balancer / Judge0 around it, over Redis · Postgres · Qdrant, feeding
 * Kafka/CDC) laid out on the proven flat-iso board so the floating labels stay readable.
 *
 * This is a SHOWCASE, not a live status board: every node reads operational and NO real prod
 * up/down/latency is bound here (leaking that publicly would signal ops state). A real per-component
 * health view belongs behind admin auth, fed by the `systemHealthStatus` query.
 */
export const BACKEND_INFRA_SCENE: ArchitectureSceneData = {
    board: { cols: [-3, 3], rows: [-3, 3], cell: 2.4 },
    camera: { position: [10, 9, 10], zoom: 25 },
    nodes: [
        { id: "client", name: "Client", sub: "web · mobile", cell: [0, -3], kind: "client", tone: "normal" },
        { id: "gateway", name: "API Gateway", sub: "graphql · ws", cell: [0, -2], kind: "loadBalancer", tone: "normal" },
        { id: "core", name: "Core API", sub: "nestjs", cell: [0, -1], kind: "container", tone: "normal" },
        { id: "keycloak", name: "Keycloak", sub: "auth · oidc", cell: [-2, 0], kind: "container", tone: "normal" },
        { id: "ai", name: "AI Balancer", sub: "multi-provider", cell: [0, 0], kind: "container", tone: "normal" },
        { id: "judge0", name: "Judge0", sub: "code runner", cell: [2, 0], kind: "container", tone: "normal" },
        { id: "redis", name: "Redis", sub: "cache · queue", cell: [-2, 1], kind: "database", tone: "normal" },
        { id: "pg", name: "Postgres", sub: "source of truth", cell: [0, 1], kind: "database", tone: "success" },
        { id: "qdrant", name: "Qdrant", sub: "vectors · rag", cell: [2, 1], kind: "database", tone: "normal" },
        { id: "kafka", name: "Kafka", sub: "debezium · cdc", cell: [2, 2], kind: "broker", tone: "normal" },
    ],
    edges: [
        { from: "client", to: "gateway", flow: true },
        { from: "gateway", to: "core", flow: true },
        { from: "core", to: "keycloak", flow: true },
        { from: "core", to: "ai", flow: true },
        { from: "core", to: "judge0", flow: true },
        { from: "core", to: "redis", flow: true },
        { from: "core", to: "pg", flow: true },
        { from: "core", to: "qdrant", flow: true },
        { from: "pg", to: "kafka", tone: "success", flow: true },
    ],
}
