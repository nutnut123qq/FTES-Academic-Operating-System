import type { GraphQLResponse } from "../../types"
import type { ModuleEntity } from "@/modules/types/entities/module"

/** Apollo variables for `modules(request: ModulesRequest!)`. */
export interface QueryModulesRequest {
    /** The course id whose modules should be listed. */
    courseId: string
}

/** Payload inside `modules.data` wrapping the array of module rows. */
export interface QueryModulesResponseData {
    /** Array of module entity rows for the course. */
    data: Array<ModuleEntity>
}

/** Apollo response shape for the `modules` query. */
export interface QueryModulesResponse {
    /** Top-level `modules` field wrapping the standard API response. */
    modules: GraphQLResponse<QueryModulesResponseData>
}
