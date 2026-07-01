import type { GraphQLResponse } from "../../types"
import type { IncompleteJobsItem } from "@/modules/types/incomplete-job"

/** Payload of `incompletedJobs` when successful. */
export interface IncompleteJobsData {
    /** Array of incomplete background job summary rows. */
    items: Array<IncompleteJobsItem>
}

/** Apollo response shape for the `incompletedJobs` query. */
export interface QueryIncompleteJobsResponse {
    /** Top-level `incompletedJobs` field wrapping the standard API response. */
    incompletedJobs: GraphQLResponse<IncompleteJobsData>
}
