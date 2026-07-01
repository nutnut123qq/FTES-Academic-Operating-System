/**
 * Lifecycle state of a single per-provider upload.
 *
 * Drives the status icon, progress-bar colors, and button disabled state in the
 * upload UI.
 */
export enum UploadStatus {
    /** Not started yet. */
    Idle = "idle",
    /** Bytes are currently being PUT to the provider. */
    Uploading = "uploading",
    /** Provider returned a 2xx response. */
    Success = "success",
    /** Network failure or non-2xx response. */
    Error = "error",
}
