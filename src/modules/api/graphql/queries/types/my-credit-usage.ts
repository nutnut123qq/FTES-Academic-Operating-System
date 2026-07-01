import type { GraphQLResponse } from "../../types"
import type {
    QueryMyCreditUsageWindowData,
} from "./my-credit-usage-window"

/** Payload inside `myCreditUsage.data` after the standard API wrapper. */
export interface QueryMyCreditUsageResponseData {
    /** Week-window used credits (mirrors `windowWeek`). */
    usedCredits: number
    /** Week-window cap (mirrors `windowWeek`). */
    quota: number
    /** Week-window remaining (mirrors `windowWeek`). */
    remainingCredits: number
    /** Whether the week-window cap is exhausted. */
    overQuota: boolean
    /** Week-window recovery time (mirrors `windowWeek`). */
    resetAt: string | null
    /** Credits within the rolling 5-hour window. */
    window5h: QueryMyCreditUsageWindowData
    /** Credits within the rolling 7-day window. */
    windowWeek: QueryMyCreditUsageWindowData
}

/** Apollo response shape for the `myCreditUsage` query. */
export interface QueryMyCreditUsageResponse {
    /** Top-level `myCreditUsage` field wrapping the standard API response. */
    myCreditUsage: GraphQLResponse<QueryMyCreditUsageResponseData>
}
