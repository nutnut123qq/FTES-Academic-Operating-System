import type { GraphQLResponse } from "../../types"
import type { ComponentStatus } from "../enums"

/**
 * Liveness of one probed infrastructure component (Postgres, Redis, Kafka, …)
 * on the public status page. Mirrors backend `ComponentHealth`.
 */
export interface SystemHealthComponent {
    /** Stable component name (e.g. `postgres`, `redis`, `kafka`). */
    name: string
    /** Traffic-light status derived from reachability + latency. */
    status: ComponentStatus | string
    /** Round-trip probe latency in ms, or `null` when the probe threw. */
    latencyMs: number | null
    /** Short human-readable note — error message on failure, else `null`. */
    message: string | null
    /** ISO timestamp the probe completed (used by the client to show freshness). */
    checkedAt: string
}

/**
 * Payload inside `systemHealthStatus.data` after the standard API wrapper.
 */
export interface QuerySystemHealthStatusResponseData {
    /** One entry per probed component, in probe order. */
    components: Array<SystemHealthComponent>
}

/**
 * Apollo response shape for the public `systemHealthStatus` query.
 */
export interface QuerySystemHealthStatusResponse {
    /** Top-level `systemHealthStatus` field wrapping the standard API response. */
    systemHealthStatus: GraphQLResponse<QuerySystemHealthStatusResponseData>
}
