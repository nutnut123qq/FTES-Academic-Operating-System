import type { GraphQLResponse } from "../../types"
import type { UserEntity } from "@/modules/types/entities/user"

/** Apollo response shape for the `me` query. */
export interface QueryMeResponse {
    /** Top-level `me` field wrapping the standard API response containing the current user. */
    me: GraphQLResponse<UserEntity>
}
