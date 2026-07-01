/** Request body for `SubmitCvPresignedUrl` (mirrors GraphQL `SubmitCvPresignedUrlRequest`). */
export interface QuerySubmitCvPresignedUrlRequest {
    /** Original file name of the CV PDF to upload. */
    fileName: string
}

/** Payload returned directly by the `SubmitCvPresignedUrl` query (not wrapped in GraphQLResponse). */
export interface SubmitCvPresignedUrlPayload {
    /** Presigned S3 PUT URL to upload the CV PDF to. */
    url: string
    /** The newly created `cv_submissions.id` row for this upload. */
    cvSubmissionId: string
    /** The newly created `cv_submission_attempts.id` row tracking this upload attempt. */
    cvSubmissionAttemptId: string
}

/** Apollo response shape for the `SubmitCvPresignedUrl` query. */
export interface QuerySubmitCvPresignedUrlResponse {
    /** Top-level `SubmitCvPresignedUrl` field returning the presigned upload payload directly. */
    SubmitCvPresignedUrl: SubmitCvPresignedUrlPayload
}
