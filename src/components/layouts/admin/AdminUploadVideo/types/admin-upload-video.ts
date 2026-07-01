import type {
    UploadStatus,
} from "../enums"

/** Tracking record for one storage provider's presigned-URL upload. */
export interface ProviderUploadStatus {
    /** Storage provider name (e.g. "s3", "r2"). */
    provider: string
    /** Presigned PUT URL the file is uploaded to. */
    url: string
    /** Current lifecycle state of this upload. */
    status: UploadStatus
    /** Upload progress as a whole-number percentage (0-100). */
    progress: number
    /** Human-readable failure reason, set only when {@link status} is error. */
    error?: string
}

/** Result returned by the process-video API after enqueueing a job. */
export interface ProcessResult {
    /** Backend job identifier for the enqueued encode job. */
    jobId: string
    /** Human-readable status message from the backend. */
    message: string
}
