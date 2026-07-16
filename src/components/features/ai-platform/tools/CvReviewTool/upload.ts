import {
    completePlatformFileUpload,
    presignPlatformFileUpload,
} from "@/modules/api/rest/platform"

/**
 * Client-side file gate + presigned upload for the CV review "upload" tab.
 *
 * The review job takes a `storageKey`, so uploading reuses the platform file
 * pipeline (`/platform/files/presign-upload` → PUT to the presigned URL →
 * `/files/{id}/complete`). The completed object is owned by the caller, which the
 * BE re-checks (`AiInputGuard.requireStorageKeyOwnership`) before enqueuing.
 */

/** Accepted upload types (spec: pdf/docx ≤ 10MB). */
export const CV_UPLOAD_MAX_BYTES = 10 * 1024 * 1024

const PDF_MIME = "application/pdf"
const DOCX_MIME =
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

/** Why a dropped file was rejected — maps to an i18n message; `null` ⇒ accepted. */
export type CvFileError = "type" | "size"

/**
 * Validates a candidate CV file entirely client-side so a wrong type/size never
 * starts an upload (spec: "drops a .png → validation message and no upload starts").
 * Matches on MIME first, then falls back to the extension because some browsers
 * report an empty `type` for `.docx`.
 */
export const validateCvFile = (file: File): CvFileError | null => {
    const name = file.name.toLowerCase()
    const okType =
        file.type === PDF_MIME ||
        file.type === DOCX_MIME ||
        name.endsWith(".pdf") ||
        name.endsWith(".docx")
    if (!okType) return "type"
    if (file.size > CV_UPLOAD_MAX_BYTES) return "size"
    return null
}

/** Whether {@link validateCvFile} accepted the file. */
export const isCvFileValid = (file: File): boolean => validateCvFile(file) === null

/** Hex SHA-256 of the file bytes (the `complete` step verifies this checksum). */
const sha256Hex = async (file: File): Promise<string> => {
    const buffer = await file.arrayBuffer()
    const digest = await crypto.subtle.digest("SHA-256", buffer)
    return Array.from(new Uint8Array(digest))
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("")
}

/**
 * Uploads a validated CV file through the presigned pipeline and returns its
 * `storageKey`, ready to submit as `{storageKey}` to the CV review job.
 *
 * @throws if the presigned PUT does not succeed (surfaced as a submit error).
 */
export const uploadCvFileToStorage = async (file: File): Promise<string> => {
    const contentType = file.type || PDF_MIME
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
