/**
 * Worker job lifecycle state in the BullMQ queue (matches backend `JobStatus`).
 */
export enum JobStatus {
    /** The job is queued and waiting to be processed. */
    Queued = "queued",
    /** The job is actively being processed by a worker. */
    Processing = "processing",
    /** The job finished successfully. */
    Completed = "completed",
    /** The job encountered an unrecoverable error. */
    Failed = "failed",
}
