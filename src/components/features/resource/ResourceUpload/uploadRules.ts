/**
 * Client-side mirror of the BE resource upload gate.
 *
 * The backend validates a version upload TWICE:
 *  - `ResourceService.createUploadUrl` → `ResourceType.allowsMime(mimeType)` (exact,
 *    lowercased match against a per-type whitelist) + `sizeBytes > type.maxSizeBytes()`
 *    → `RESOURCE_VALIDATION` / `RESOURCE_FILE_TOO_LARGE`;
 *  - `UploadUrlRequest` bean validation → `@Positive sizeBytes`, `@NotBlank` 64-char
 *    `checksumSha256`, `filename` ≤ 512 chars.
 *
 * Everything here is a copy of `vn.ftes.aos.resource.domain.ResourceType` so a file the
 * BE would refuse never starts a create → presign → PUT chain. Keep the two in sync.
 */

/** Resource type codes — the BE `ResourceType` enum names (sent verbatim in `type`). */
export const RESOURCE_TYPE_CODES = [
    "PDF",
    "SLIDE",
    "VIDEO",
    "BOOK",
    "SOURCE_CODE",
    "ASSIGNMENT",
    "PE",
    "FE",
    "NOTES",
    "TEMPLATES",
] as const

/** One BE `ResourceType` enum name. */
export type ResourceTypeCode = (typeof RESOURCE_TYPE_CODES)[number]

/** Per-type upload rule: accepted MIME whitelist + max size, mirroring the BE enum. */
export interface ResourceTypeRule {
    /** MIME types the BE accepts for this type (exact, lowercase). */
    mimeTypes: ReadonlyArray<string>
    /** Extensions offered to the file picker (`accept` attribute). */
    extensions: ReadonlyArray<string>
    /** Max size in MB (BE `maxSizeMb`). */
    maxSizeMb: number
}

/** MIME whitelist + max size per type — MUST match BE `ResourceType`. */
export const RESOURCE_TYPE_RULES: Record<ResourceTypeCode, ResourceTypeRule> = {
    PDF: {
        mimeTypes: ["application/pdf"],
        extensions: [".pdf"],
        maxSizeMb: 100,
    },
    SLIDE: {
        mimeTypes: [
            "application/vnd.ms-powerpoint",
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            "application/pdf",
        ],
        extensions: [".ppt", ".pptx", ".pdf"],
        maxSizeMb: 100,
    },
    VIDEO: {
        mimeTypes: ["video/mp4", "video/webm", "video/quicktime"],
        extensions: [".mp4", ".webm", ".mov"],
        maxSizeMb: 500,
    },
    BOOK: {
        mimeTypes: ["application/pdf", "application/epub+zip"],
        extensions: [".pdf", ".epub"],
        maxSizeMb: 200,
    },
    SOURCE_CODE: {
        mimeTypes: [
            "application/zip",
            "application/x-zip-compressed",
            "application/gzip",
            "application/x-tar",
        ],
        extensions: [".zip", ".gz", ".tgz", ".tar"],
        maxSizeMb: 100,
    },
    ASSIGNMENT: {
        mimeTypes: [
            "application/pdf",
            "application/zip",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ],
        extensions: [".pdf", ".zip", ".doc", ".docx"],
        maxSizeMb: 100,
    },
    PE: {
        mimeTypes: ["application/pdf", "application/zip"],
        extensions: [".pdf", ".zip"],
        maxSizeMb: 100,
    },
    FE: {
        mimeTypes: ["application/pdf", "application/zip"],
        extensions: [".pdf", ".zip"],
        maxSizeMb: 100,
    },
    NOTES: {
        mimeTypes: ["application/pdf", "text/markdown", "text/plain"],
        extensions: [".pdf", ".md", ".txt"],
        maxSizeMb: 50,
    },
    TEMPLATES: {
        mimeTypes: [
            "application/zip",
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ],
        extensions: [".zip", ".pdf", ".docx"],
        maxSizeMb: 50,
    },
}

/** Canonical MIME per extension — the fallback when the browser reports no `File.type`. */
const EXTENSION_MIME_TYPES: Record<string, ReadonlyArray<string>> = {
    ".pdf": ["application/pdf"],
    ".ppt": ["application/vnd.ms-powerpoint"],
    ".pptx": [
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ],
    ".mp4": ["video/mp4"],
    ".webm": ["video/webm"],
    ".mov": ["video/quicktime"],
    ".epub": ["application/epub+zip"],
    ".zip": ["application/zip", "application/x-zip-compressed"],
    ".gz": ["application/gzip"],
    ".tgz": ["application/gzip"],
    ".tar": ["application/x-tar"],
    ".doc": ["application/msword"],
    ".docx": [
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
    ".md": ["text/markdown", "text/plain"],
    ".txt": ["text/plain"],
}

/**
 * Equivalent MIME spellings. Windows/Chrome report a `.zip` as
 * `application/x-zip-compressed`, which `PE`/`FE`/`ASSIGNMENT` do NOT whitelist —
 * sending it verbatim gets a 400 `RESOURCE_VALIDATION`. The alias table lets us
 * substitute the spelling the picked type actually accepts.
 */
const MIME_ALIASES: Record<string, ReadonlyArray<string>> = {
    "application/zip": ["application/x-zip-compressed", "application/x-zip"],
    "application/x-zip-compressed": ["application/zip"],
    "application/x-zip": ["application/zip"],
    "application/gzip": ["application/x-gzip"],
    "application/x-gzip": ["application/gzip"],
    "text/markdown": ["text/x-markdown", "text/plain"],
    "text/plain": ["text/markdown"],
}

/** Lowercased extension of a filename (with the leading dot), or `""` when it has none. */
export const fileExtension = (filename: string): string => {
    const dot = filename.lastIndexOf(".")
    return dot > 0 ? filename.slice(dot).toLowerCase() : ""
}

/** Strips any `; charset=…` parameter and lowercases a browser-reported MIME. */
const normalizeMime = (raw: string | undefined | null): string =>
    (raw ?? "").split(";")[0]?.trim().toLowerCase() ?? ""

/**
 * Resolves the MIME string to send to `POST /{id}/versions/upload-url` for a picked
 * file + type, or `null` when the file is not acceptable for that type.
 *
 * Resolution order: the browser MIME when whitelisted → an accepted alias of it →
 * the canonical MIME of the file extension. This makes `.zip` uploads work on
 * browsers that report `application/x-zip-compressed`, and `.md` uploads work on
 * browsers that report an empty type.
 */
export const resolveResourceMimeType = (
    file: Pick<File, "name" | "type">,
    type: ResourceTypeCode,
): string | null => {
    const allowed = RESOURCE_TYPE_RULES[type].mimeTypes
    const reported = normalizeMime(file.type)

    if (reported !== "" && allowed.includes(reported)) {
        return reported
    }
    for (const alias of MIME_ALIASES[reported] ?? []) {
        if (allowed.includes(alias)) {
            return alias
        }
    }
    for (const candidate of EXTENSION_MIME_TYPES[fileExtension(file.name)] ?? []) {
        if (allowed.includes(candidate)) {
            return candidate
        }
    }
    return null
}

/** Why a picked file was rejected client-side; `null` in {@link ResourceFileAccepted}. */
export type ResourceFileRejection = "type" | "size" | "empty" | "filename"

/** A file the BE gate would accept, carrying the MIME to send upstream. */
export interface ResourceFileAccepted {
    ok: true
    mimeType: string
}

/** A file rejected before any request is made. */
export interface ResourceFileRejected {
    ok: false
    reason: ResourceFileRejection
    /** Max size for the picked type, in MB — rendered in the "too large" message. */
    maxSizeMb: number
}

/** Result of {@link validateResourceFile}. */
export type ResourceFileValidation = ResourceFileAccepted | ResourceFileRejected

/** BE `UploadUrlRequest.filename` is `@Size(max = 512)`. */
export const MAX_FILENAME_LENGTH = 512

/**
 * Validates a picked file against the BE gate for the chosen resource type.
 *
 * @param file - the picked file.
 * @param type - the resource type selected in the form.
 * @returns the resolved MIME on success, or the rejection reason (never throws).
 */
export const validateResourceFile = (
    file: Pick<File, "name" | "type" | "size">,
    type: ResourceTypeCode,
): ResourceFileValidation => {
    const rule = RESOURCE_TYPE_RULES[type]
    if (file.name.length > MAX_FILENAME_LENGTH) {
        return { ok: false, reason: "filename", maxSizeMb: rule.maxSizeMb }
    }
    // BE `@Positive sizeBytes` rejects a 0-byte object before the type check.
    if (file.size <= 0) {
        return { ok: false, reason: "empty", maxSizeMb: rule.maxSizeMb }
    }
    const mimeType = resolveResourceMimeType(file, type)
    if (mimeType === null) {
        return { ok: false, reason: "type", maxSizeMb: rule.maxSizeMb }
    }
    if (file.size > rule.maxSizeMb * 1024 * 1024) {
        return { ok: false, reason: "size", maxSizeMb: rule.maxSizeMb }
    }
    return { ok: true, mimeType }
}

/** `accept` attribute for the hidden file input of a given type. */
export const resourceAcceptAttribute = (type: ResourceTypeCode): string =>
    RESOURCE_TYPE_RULES[type].extensions.join(",")

/** Human file size (`8.4 MB`) for the dropzone summary. Locale-agnostic on purpose. */
export const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) {
        return `${bytes} B`
    }
    const units = ["KB", "MB", "GB"]
    let value = bytes / 1024
    let unit = 0
    while (value >= 1024 && unit < units.length - 1) {
        value /= 1024
        unit += 1
    }
    return `${value >= 10 ? Math.round(value) : Math.round(value * 10) / 10} ${units[unit]}`
}
