import type { GraphQLResponse } from "../../types"
import type { ModuleEntity } from "@/modules/types/entities/module"

/** Apollo response shape for the `module` query. */
export interface QueryModuleResponse {
    /** Top-level `module` field wrapping the standard API response. */
    module: GraphQLResponse<ModuleEntity>
}

/** Request body for the `module` query (mirrors GraphQL `ModuleRequest`). */
export interface ModuleRequest {
    /** The display id of the module to fetch. */
    displayId?: string
    /** The primary id of the module to fetch. */
    id?: string
}
