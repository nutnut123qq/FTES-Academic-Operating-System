import type { LANDING_COURSE_TRACKS } from "../constants"

/** A course track key (matches {@link LANDING_COURSE_TRACKS}). */
export type TrackKey = (typeof LANDING_COURSE_TRACKS)[number]

/** Per-track visual + force config: glow colour (CSS var), node accents, and the
 * horizontal anchor the cluster gravitates toward (so the 3 tracks read as 3
 * loose clusters that still interlink). */
export const TRACK_CONFIG: Record<TrackKey, {
    glow: string
    dot: string
    ring: string
    anchorX: number
    anchorY: number
}> = {
    fullstack: { glow: "var(--accent)", dot: "bg-accent", ring: "border-accent/55", anchorX: -170, anchorY: -90 },
    systemDesign: { glow: "var(--success)", dot: "bg-success", ring: "border-success/55", anchorX: 0, anchorY: 150 },
    devops: { glow: "var(--warning)", dot: "bg-warning", ring: "border-warning/55", anchorX: 170, anchorY: -90 },
}

/** One concept in the knowledge graph. `label` = a real curriculum concept (English
 * technical term, same vi/en); `track` = the flagship course that teaches it. */
export interface ConceptNodeDatum {
    id: string
    label: string
    track: TrackKey
}

/** Curated concept nodes — grounded in real module/lesson/challenge titles across the
 * 3 flagship courses (a marketing illustration of "knowledge that interlinks"). */
export const KNOWLEDGE_NODES: ReadonlyArray<ConceptNodeDatum> = [
    // System Design (success)
    { id: "cap", label: "CAP theorem", track: "systemDesign" },
    { id: "sharding", label: "Sharding", track: "systemDesign" },
    { id: "saga", label: "Saga", track: "systemDesign" },
    { id: "idempotency", label: "Idempotency", track: "systemDesign" },
    { id: "redlock", label: "Redlock", track: "systemDesign" },
    { id: "kafka", label: "Kafka log", track: "systemDesign" },
    { id: "cdc", label: "CDC / Debezium", track: "systemDesign" },
    { id: "token-bucket", label: "Token bucket", track: "systemDesign" },
    { id: "websocket", label: "WebSocket gateway", track: "systemDesign" },
    { id: "tracing", label: "Distributed tracing", track: "systemDesign" },
    { id: "consistentHashing", label: "Consistent hashing", track: "systemDesign" },
    { id: "circuitBreaker", label: "Circuit breaker", track: "systemDesign" },
    { id: "eventSourcing", label: "Event sourcing", track: "systemDesign" },
    { id: "readReplica", label: "Read replica", track: "systemDesign" },
    // Fullstack (accent)
    { id: "nestjs", label: "NestJS", track: "fullstack" },
    { id: "typeorm", label: "TypeORM", track: "fullstack" },
    { id: "webhooks", label: "Webhooks", track: "fullstack" },
    { id: "payment", label: "Payment", track: "fullstack" },
    { id: "rag", label: "RAG / pgvector", track: "fullstack" },
    { id: "oauth", label: "OAuth / JWT", track: "fullstack" },
    { id: "jobs", label: "Background jobs", track: "fullstack" },
    { id: "rsc", label: "React RSC", track: "fullstack" },
    { id: "graphql", label: "GraphQL", track: "fullstack" },
    { id: "redisCache", label: "Redis cache", track: "fullstack" },
    { id: "sse", label: "Server-Sent Events", track: "fullstack" },
    { id: "zodValidation", label: "Zod validation", track: "fullstack" },
    // DevOps (warning)
    { id: "k8s", label: "Kubernetes", track: "devops" },
    { id: "ingress", label: "Ingress", track: "devops" },
    { id: "argocd", label: "ArgoCD", track: "devops" },
    { id: "rollouts", label: "Argo Rollouts", track: "devops" },
    { id: "prometheus", label: "Prometheus", track: "devops" },
    { id: "rbac", label: "RBAC", track: "devops" },
    { id: "terraform", label: "Terraform", track: "devops" },
    { id: "falco", label: "Falco", track: "devops" },
    { id: "helm", label: "Helm", track: "devops" },
    { id: "autoscaling", label: "Autoscaling (HPA)", track: "devops" },
    { id: "serviceMesh", label: "Service mesh", track: "devops" },
    { id: "grafana", label: "Grafana", track: "devops" },
]

/** One interconnection. `cross: true` = links two different tracks (the "lồng ghép"
 * story — knowledge from one track feeds another). */
export interface ConceptEdgeDatum {
    source: string
    target: string
    cross?: boolean
}

/** Curated edges — within-track "builds-on" chains + cross-track links. */
export const KNOWLEDGE_EDGES: ReadonlyArray<ConceptEdgeDatum> = [
    // System Design internal
    { source: "cap", target: "sharding" },
    { source: "cap", target: "saga" },
    { source: "cap", target: "token-bucket" },
    { source: "sharding", target: "cdc" },
    { source: "saga", target: "idempotency" },
    { source: "redlock", target: "token-bucket" },
    { source: "redlock", target: "idempotency" },
    { source: "kafka", target: "cdc" },
    { source: "kafka", target: "idempotency" },
    { source: "websocket", target: "kafka" },
    { source: "tracing", target: "kafka" },
    // Fullstack internal
    { source: "nestjs", target: "typeorm" },
    { source: "nestjs", target: "jobs" },
    { source: "nestjs", target: "oauth" },
    { source: "nestjs", target: "rsc" },
    { source: "webhooks", target: "payment" },
    { source: "rag", target: "typeorm" },
    // DevOps internal
    { source: "k8s", target: "ingress" },
    { source: "k8s", target: "argocd" },
    { source: "argocd", target: "rollouts" },
    { source: "rollouts", target: "prometheus" },
    { source: "rbac", target: "k8s" },
    { source: "terraform", target: "k8s" },
    { source: "falco", target: "k8s" },
    // Cross-track ("kiến thức lồng ghép")
    { source: "idempotency", target: "webhooks", cross: true },
    { source: "idempotency", target: "payment", cross: true },
    { source: "cdc", target: "typeorm", cross: true },
    { source: "kafka", target: "jobs", cross: true },
    { source: "prometheus", target: "tracing", cross: true },
    { source: "oauth", target: "rbac", cross: true },
    { source: "rollouts", target: "tracing", cross: true },
    // mở rộng — thêm thuật ngữ + liên kết (builds-on + cross-track)
    { source: "sharding", target: "consistentHashing" },
    { source: "saga", target: "circuitBreaker" },
    { source: "kafka", target: "eventSourcing" },
    { source: "cdc", target: "eventSourcing" },
    { source: "sharding", target: "readReplica" },
    { source: "nestjs", target: "graphql" },
    { source: "nestjs", target: "redisCache" },
    { source: "nestjs", target: "zodValidation" },
    { source: "nestjs", target: "sse" },
    { source: "redisCache", target: "redlock", cross: true },
    { source: "sse", target: "websocket", cross: true },
    { source: "k8s", target: "helm" },
    { source: "argocd", target: "helm" },
    { source: "k8s", target: "autoscaling" },
    { source: "k8s", target: "serviceMesh" },
    { source: "prometheus", target: "grafana" },
    { source: "autoscaling", target: "prometheus", cross: true },
    { source: "serviceMesh", target: "tracing", cross: true },
]

/** Degree (số kết nối) mỗi node — drive kích thước bubble: hub to, lá nhỏ. */
export const NODE_DEGREE: Record<string, number> = (() => {
    const degree: Record<string, number> = {}
    for (const node of KNOWLEDGE_NODES) {
        degree[node.id] = 0
    }
    for (const edge of KNOWLEDGE_EDGES) {
        degree[edge.source] = (degree[edge.source] ?? 0) + 1
        degree[edge.target] = (degree[edge.target] ?? 0) + 1
    }
    return degree
})()

/** Bán kính bubble (px) theo degree — slope nhẹ để khung CONTAINED (nửa cột) đỡ chật:
 * leaf (deg 1) ≈ 20px → hub (deg 8) ≈ 48px (trước 18+deg*6 cho hub ~66px, quá to). */
export const bubbleRadius = (degree: number): number => 16 + degree * 4
