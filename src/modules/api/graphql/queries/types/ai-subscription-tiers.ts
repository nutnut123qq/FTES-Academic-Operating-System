import type { GraphQLResponse } from "../../types"

/** One purchasable AI subscription tier returned by the `aiSubscriptionTiers` query. */
export interface AiSubscriptionTier {
    /** Slug identifier for the tier (e.g. "plus", "pro", "max"). */
    tier: string
    /** Human-readable display name for the tier. */
    displayName: string
    /** Price in VND for one subscription period (charged by domestic gateways). */
    priceVnd: number
    /** Price in USD for one subscription period (charged by international gateways). */
    priceUsd: number
    /** Short tagline — who the plan is for / its purpose. */
    description: string
    /** Number of AI credits awarded per 5-hour block. */
    creditsPer5h: number
    /** Number of AI credits awarded per week. */
    creditsPerWeek: number
    /** Whether this tier should be highlighted as the recommended/popular choice. */
    popular: boolean
}

/** Payload inside `aiSubscriptionTiers.data` after the standard API wrapper. */
export interface QueryAiSubscriptionTiersResponseData {
    /** Array of all available purchasable AI subscription tiers. */
    tiers: Array<AiSubscriptionTier>
}

/** Apollo response shape for the `aiSubscriptionTiers` query. */
export interface QueryAiSubscriptionTiersResponse {
    /** Top-level `aiSubscriptionTiers` field wrapping the standard API response. */
    aiSubscriptionTiers: GraphQLResponse<QueryAiSubscriptionTiersResponseData>
}
