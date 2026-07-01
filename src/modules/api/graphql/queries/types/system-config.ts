import type { GraphQLResponse } from "../../types"
import type { SystemConfigData } from "@/modules/types/system-config"

/** Apollo response shape for the `systemConfig` query. */
export interface QuerySystemConfigResponse {
    /** Top-level `systemConfig` field wrapping the standard API response. */
    systemConfig: GraphQLResponse<SystemConfigData>
}
