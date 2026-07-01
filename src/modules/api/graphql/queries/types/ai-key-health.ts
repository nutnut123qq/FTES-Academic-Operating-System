import type { GraphQLResponse } from "../../types"
import type { ModelProvider } from "../query-my-ai-settings"

/**
 * Public-safe view of one AI key: a masked label (`sk-...x9f`) and a single
 * healthy flag. The raw value, fail counts and cooldown timestamps are never
 * exposed (those stay behind the admin `aiBalancerHealth` query).
 */
export interface PublicKeyHealth {
    /** Masked key label, e.g. `sk-...x9f` (raw value never exposed). */
    keyMask: string
    /** Whether the key is healthy right now. */
    healthy: boolean
}

/**
 * Public key health for one model group (the keys behind one `.key` file).
 */
export interface AiKeyHealthGroup {
    /** Provider that serves these keys. */
    provider: ModelProvider | string
    /** Models that run on this key set. */
    models: Array<string>
    /** Total keys behind this model. */
    totalKeys: number
    /** How many of those keys are healthy right now. */
    healthyKeys: number
    /** Per-key masked health. */
    keys: Array<PublicKeyHealth>
}

/**
 * Payload inside `aiKeyHealth.data` after the standard API wrapper.
 */
export interface QueryAiKeyHealthResponseData {
    /** One group per model. */
    groups: Array<AiKeyHealthGroup>
}

/**
 * Apollo response shape for the public `aiKeyHealth` query.
 */
export interface QueryAiKeyHealthResponse {
    /** Top-level `aiKeyHealth` field wrapping the standard API response. */
    aiKeyHealth: GraphQLResponse<QueryAiKeyHealthResponseData>
}
