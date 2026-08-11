/**
 * Client-side mirror of the BE gate on a PE **answer** upload
 * (`POST /api/v1/resources/{id}/pe-submissions`).
 *
 * This is a different whitelist from the resource-version one in
 * `ResourceUpload/uploadRules.ts`: that gate governs the exam PAPER a contributor
 * publishes, while this one governs the FILE a student hands in — Office documents
 * (OOXML *and* legacy), PDF, pictures, plain text formats and a zip, capped at 25 MB.
 * Keep it in sync with the backend so a doomed 25 MB upload never leaves the browser.
 */

/** MIME types the BE accepts for a PE answer (exact, lowercase). */
export const PE_ANSWER_MIME_TYPES: ReadonlyArray<string> = [
    // Word
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    // Excel
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    // PowerPoint
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    // documents & pictures
    "application/pdf",
    "image/png",
    "image/jpeg",
    "image/webp",
    // text-ish
    "text/plain",
    "text/markdown",
    "text/csv",
    "application/json",
    "application/xml",
    "text/xml",
    // archive
    "application/zip",
]

/** Extensions offered to the file picker (`accept` attribute). */
export const PE_ANSWER_EXTENSIONS: ReadonlyArray<string> = [
    ".doc",
    ".docx",
    ".xls",
    ".xlsx",
    ".ppt",
    ".pptx",
    ".pdf",
    ".png",
    ".jpg",
    ".jpeg",
    ".webp",
    ".txt",
    ".md",
    ".csv",
    ".json",
    ".xml",
    ".zip",
]

/** Hard cap on a PE answer, in MB (BE `maxSizeBytes`). */
export const PE_ANSWER_MAX_SIZE_MB = 25

/**
 * Equivalent MIME spellings. Windows/Chrome report a `.zip` as
 * `application/x-zip-compressed` and a `.md` as `text/plain` (or nothing at all), so a
 * literal comparison would reject files the BE happily accepts.
 */
const MIME_ALIASES: Record<string, ReadonlyArray<string>> = {
    "application/x-zip-compressed": ["application/zip"],
    "application/x-zip": ["application/zip"],
    "text/x-markdown": ["text/markdown"],
    "application/csv": ["text/csv"],
    "text/json": ["application/json"],
}

/** Canonical MIME per extension — the fallback when the browser reports no `File.type`. */
const EXTENSION_MIME_TYPES: Record<string, string> = {
    ".doc": "application/msword",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".xls": "application/vnd.ms-excel",
    ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ".ppt": "application/vnd.ms-powerpoint",
    ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ".pdf": "application/pdf",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".txt": "text/plain",
    ".md": "text/markdown",
    ".csv": "text/csv",
    ".json": "application/json",
    ".xml": "application/xml",
    ".zip": "application/zip",
}

/** Why a picked answer file was rejected before any request went out. */
export type PeAnswerRejection = "type" | "size" | "empty"

/** Outcome of {@link validatePeAnswerFile}. */
export type PeAnswerValidation =
    | { ok: true }
    | { ok: false; reason: PeAnswerRejection }

/** Lowercased extension of a filename (with the leading dot), or `""` when it has none. */
const fileExtension = (filename: string): string => {
    const dot = filename.lastIndexOf(".")
    return dot > 0 ? filename.slice(dot).toLowerCase() : ""
}

/** Strips any `; charset=…` parameter and lowercases a browser-reported MIME. */
const normalizeMime = (raw: string | undefined | null): string =>
    (raw ?? "").split(";")[0]?.trim().toLowerCase() ?? ""

/**
 * Checks a picked answer file against the BE gate.
 *
 * Resolution order for the type: the browser MIME when whitelisted → an accepted alias
 * of it → the canonical MIME of the file extension. This makes `.zip` work on browsers
 * that report `application/x-zip-compressed` and `.md`/`.csv` work on browsers that
 * report an empty type.
 *
 * @param file - The picked file (only name/type/size are read).
 * @returns `{ ok: true }` or the rejection reason. Never throws.
 */
export const validatePeAnswerFile = (
    file: Pick<File, "name" | "type" | "size">,
): PeAnswerValidation => {
    if (file.size <= 0) {
        return { ok: false, reason: "empty" }
    }
    const reported = normalizeMime(file.type)
    const accepted =
        (reported !== "" && PE_ANSWER_MIME_TYPES.includes(reported)) ||
        (MIME_ALIASES[reported] ?? []).some((alias) =>
            PE_ANSWER_MIME_TYPES.includes(alias),
        ) ||
        PE_ANSWER_MIME_TYPES.includes(EXTENSION_MIME_TYPES[fileExtension(file.name)] ?? "")
    if (!accepted) {
        return { ok: false, reason: "type" }
    }
    if (file.size > PE_ANSWER_MAX_SIZE_MB * 1024 * 1024) {
        return { ok: false, reason: "size" }
    }
    return { ok: true }
}

/** `accept` attribute for the answer file input. */
export const peAnswerAcceptAttribute = (): string => PE_ANSWER_EXTENSIONS.join(",")
