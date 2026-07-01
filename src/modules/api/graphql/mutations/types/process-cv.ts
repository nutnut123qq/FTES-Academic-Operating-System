import type { GraphQLResponse, QueryVariables } from "../../types"

/** Payload inside `processCV.data` after the standard API wrapper. */
export interface ProcessCVData {
    /** Background job ID enqueued for processing. */
    jobId: string
    /** Initial status of the processing job (e.g. `pending`). */
    status: string
}

/** GraphQL `ProcessCVRequest` body. */
export interface ProcessCVRequest {
    /** S3 object key of the uploaded CV. */
    s3Key: string
    /** Original file name for display purposes. */
    fileName: string
}

/** Apollo variables bag for the `processCV` mutation. */
export type MutateProcessCVVariables = QueryVariables<ProcessCVRequest>

/** Apollo response shape for `processCV`. */
export interface MutateProcessCVResponse {
    /** Top-level `processCV` field wrapping the standard API response. */
    processCV: GraphQLResponse<ProcessCVData>
}
