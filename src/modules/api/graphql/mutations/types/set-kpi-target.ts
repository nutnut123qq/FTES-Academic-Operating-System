import type { GraphQLResponse } from "../../types"
import type { KpiKey } from "../../queries/types/my-kpis"

/** GraphQL `SetKpiTargetRequest` body. */
export interface SetKpiTargetRequest {
    /** Which KPI to set the target for. */
    key: KpiKey
    /** Target value for this KPI (0 clears it; clamped per-KPI server-side). */
    target: number
}

/** Apollo response shape for `setKpiTarget` (no data payload). */
export interface MutateSetKpiTargetResponse {
    /** Top-level `setKpiTarget` field wrapping the standard API response. */
    setKpiTarget: GraphQLResponse
}
