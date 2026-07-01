/**
 * Request / response shapes for the admin process-video REST endpoint.
 */

/** Body sent to `POST /api/v1/admin/process-video`. */
export interface AdminProcessVideoRequest {
    /** Full S3 URL of the source video (MinIO or DigitalOcean). */
    url: string
}

/** Payload returned on successful process-video job enqueue. */
export interface AdminProcessVideoResponse {
    /** The created BullMQ job ID. */
    jobId: string
    /** Human-readable status message. */
    message: string
}
