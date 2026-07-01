/**
 * Request / response shapes for the admin presigned URL REST endpoint.
 */

/** Body sent to `POST /api/v1/admin/presigned-url`. */
export interface AdminPresignedUrlRequest {
    /** The object key (path) to upload to in S3. */
    key: string
    /** The MIME content type of the file to upload. */
    contentType?: string
}

/** Single presigned URL item in the response. */
export interface AdminPresignedUrlItem {
    /** The S3 provider name (e.g. "minio", "digitalocean"). */
    provider: string
    /** The presigned upload URL. */
    url: string
}

/** Payload returned on successful presigned URL generation. */
export interface AdminPresignedUrlResponse {
    /** Array of presigned URLs, one per S3 provider. */
    data: Array<AdminPresignedUrlItem>
}
