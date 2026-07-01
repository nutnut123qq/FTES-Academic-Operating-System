import type { GraphQLResponse, QueryVariables } from "../../types"
import type { MilestoneTaskEntity } from "@/modules/types/entities/milestone"

/** Request body for the `task` GraphQL query (milestone task by id). */
export interface MilestoneTaskQueryRequest {
    /** Milestone task primary id to fetch. */
    id: string
}

/** Apollo response shape for the `task` query (milestone task). */
export interface QueryMilestoneTaskResponse {
    /** Top-level `task` field wrapping the standard API response. */
    task: GraphQLResponse<MilestoneTaskEntity>
}

/** Apollo variables bag for the `task` query. */
export type QueryMilestoneTaskVariables = QueryVariables<MilestoneTaskQueryRequest>
