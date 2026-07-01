import type { GraphQLResponse } from "../../types"
import type { ModelProvider } from "../query-my-ai-settings"
import type { AiBalancerKeyStatus } from "../enums"

/**
 * Per-key health row returned by `aiBalancerHealth` (raw key value never sent).
 */
export interface AiBalancerKeyHealth {
    /** Provider this key belongs to. */
    provider: ModelProvider
    /** Last four characters of the key (opaque handle). */
    keySuffix: string
    /** Lifecycle status — active / disabled / probing. */
    status: AiBalancerKeyStatus | string
    /** Consecutive failures since last success (0 when healthy). */
    failCount: number
    /** Last real API use attempt (success or failure), if tracked. */
    lastUsedAt: string | null
    /** Last scheduled ping or cache write timestamp. */
    lastHealthCheckAt: string | null
    /** When the key was marked disabled (null when active). */
    disabledAt: string | null
}

/**
 * Aggregate health for one provider's mounted key pool.
 */
export interface AiBalancerProviderHealth {
    /** Provider identifier. */
    provider: ModelProvider
    /** Mount path of the keys file (ops reference). */
    keysFilePath: string
    /** Total keys in the pool. */
    totalKeys: number
    /** Keys currently eligible for rotation. */
    activeKeys: number
    /** Keys currently marked unhealthy in cache. */
    disabledKeys: number
    /** Per-key rows. */
    keys: Array<AiBalancerKeyHealth>
}

/**
 * Payload inside `aiBalancerHealth.data` after the standard API wrapper.
 */
export interface QueryAiBalancerHealthResponseData {
    /** Per-provider summaries. */
    providers: Array<AiBalancerProviderHealth>
}

/**
 * Apollo response shape for the `aiBalancerHealth` query.
 */
export interface QueryAiBalancerHealthResponse {
    /** Top-level `aiBalancerHealth` field wrapping the standard API response. */
    aiBalancerHealth: GraphQLResponse<QueryAiBalancerHealthResponseData>
}
