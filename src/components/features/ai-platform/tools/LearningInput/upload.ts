import {
    completePlatformFileUpload,
    presignPlatformFileUpload,
} from "@/modules/api/rest/platform"

/**
 * Client-side file gate + presigned upload for the learning tools' "upload"
 * source (summary / flashcards / quiz).
 *
 * The BE learning job guard (`JobController.guardLearningInput`) accepts EXACTLY
 * ONE content reference — `lessonId`, `storageKey`, or `resourceId` — and rejects
 * a raw `{text}` body with 400 `AI_INPUT_INVALID`. Free-typed text therefore has
 * no valid path (see also `PLATFORM_FILE_TYPE_NOT_ALLOWED` — the platform file
 * store only allows pdf/png/jpeg/webp, so a `text/plain` blob upload is refused).
 * A pasted-document source must go through the presigned file pipeline
 * (`/platform/files/presign-upload` → PUT → `/files/{id}/complete`) to obtain a
 * `storageKey`; the completed object is owned by the caller, which the BE re-checks
 * (`AiInputGuard.requireStorageKeyOwnership`) before enqueuing.
 *
 * The accepted MIME set mirrors the BE whitelist (`FileStorageService.ALLOWED_TYPES`:
 * `application/pdf`, `image/png`, `image/jpeg`, `image/webp`) so a file the store
 * would reject never starts an upload.
 */

/** Accepted upload size (BE `IMAGE_MAX` = 10MB for non-video). */
export const LEARNING_UPLOAD_MAX_BYTES = 10 * 1024 * 1024

/** MIME whitelist — MUST match BE `FileStorageService.ALLOWED_TYPES` (non-video). */
const ALLOWED_MIMES = new Set([
    "application/pdf",
    "image/png",
    "image/jpeg",
    "image/webp",
])

/** Extension fallback for browsers that report an empty `File.type`. */
const ALLOWED_EXTENSIONS = [".pdf", ".png", ".jpg", ".jpeg", ".webp"]

/** Why a picked file was rejected — maps to an i18n message; `null` ⇒ accepted. */
export type LearningFileError = "type" | "size"

/**
 * Validates a candidate learning-source file entirely client-side so a wrong
 * type/size never starts an upload. Matches on MIME first, then falls back to the
 * extension.
 */
export const validateLearningFile = (file: File): LearningFileError | null => {
    const name = file.name.toLowerCase()
    const okType =
        ALLOWED_MIMES.has(file.type) ||
        ALLOWED_EXTENSIONS.some((ext) => name.endsWith(ext))
    if (!okType) return "type"
    if (file.size > LEARNING_UPLOAD_MAX_BYTES) return "size"
    return null
}

/** Whether {@link validateLearningFile} accepted the file. */
export const isLearningFileValid = (file: File): boolean =>
    validateLearningFile(file) === null

/** Hex SHA-256 of the file bytes (the `complete` step verifies this checksum). */
const sha256Hex = async (file: File): Promise<string> => {
    const buffer = await file.arrayBuffer()
    const digest = await crypto.subtle.digest("SHA-256", buffer)
    return Array.from(new Uint8Array(digest))
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("")
}

/**
 * Uploads a validated file through the presigned pipeline and returns its
 * `storageKey`, ready to submit as `{storageKey}` to a learning job.
 *
 * @throws if the presigned PUT does not succeed (surfaced as a submit error).
 */
export const uploadLearningFileToStorage = async (file: File): Promise<string> => {
    const contentType = file.type || "application/pdf"
    const checksum = await sha256Hex(file)

    const presigned = await presignPlatformFileUpload({
        fileName: file.name,
        contentType,
        sizeBytes: file.size,
        visibility: "PRIVATE",
    })

    const put = await fetch(presigned.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": contentType },
        body: file,
    })
    if (!put.ok) {
        throw new Error(`Upload failed (${put.status})`)
    }

    await completePlatformFileUpload(presigned.fileId, { checksumSha256: checksum })
    return presigned.objectKey
}
