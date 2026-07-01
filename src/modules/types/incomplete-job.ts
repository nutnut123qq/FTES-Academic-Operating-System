import type { JobStatus } from "./enums"

/** One row in `incompletedJobs.data.items` — a background job id plus its current status. */
export interface IncompleteJobsItem {
    /** Unique identifier of the background job. */
    jobId: string
    /** Current processing status of the background job. */
    status: JobStatus
}
