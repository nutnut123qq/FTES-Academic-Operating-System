/**
 * Client-side project intake for the agentic project grader (PIN §4A). A learner submits
 * a project either as a `.zip` OR by picking a whole folder (`<input webkitdirectory>`);
 * both paths converge here into ONE `.zip` {@link Blob} (submitted verbatim via the
 * existing `submitChallengeFile` multipart flow) plus a flat list of project-relative
 * paths for the pre-submit tree preview ({@link ProjectTreePreview}).
 *
 * fflate does the zip/unzip in-browser (async callbacks wrapped in Promises so a large
 * project never blocks the main thread). The BE re-derives the real graded file set from
 * the submitted blob (its own whitelist + zip-bomb caps, PIN §6), so this stays a
 * best-effort preview: obvious noise directories are skipped and a generous total-size /
 * file-count safety cap guards the browser, but the authoritative grading caps live BE-side.
 */

import { unzip, zip } from "fflate"

/** A prepared project ready to preview + submit. */
export interface PreparedProject {
    /** The single `.zip` Blob to submit (the picked zip itself, or a freshly-built one). */
    blob: Blob
    /** Suggested filename for the submitted zip part. */
    fileName: string
    /** Project-relative paths (POSIX `/` separators), sorted, for the tree preview. */
    paths: Array<string>
    /** Byte size per path, for the tree preview's size hints. */
    sizeByPath: Record<string, number>
}

/** Discriminates why a project intake failed, so the UI can map to an i18n message. */
export type ProjectArchiveErrorKind = "empty" | "too-large" | "read"

/** A typed intake failure — {@link ProjectArchiveErrorKind} drives the learner-facing copy. */
export class ProjectArchiveError extends Error {
    readonly kind: ProjectArchiveErrorKind

    constructor(kind: ProjectArchiveErrorKind, message?: string) {
        super(message ?? kind)
        this.name = "ProjectArchiveError"
        this.kind = kind
    }
}

/**
 * Directory segments never worth submitting/previewing — dependency caches, VCS metadata,
 * build output, editor config. A path is dropped when ANY of its segments matches.
 */
const NOISE_DIRECTORIES = new Set<string>([
    "node_modules",
    ".git",
    ".svn",
    ".hg",
    "dist",
    "build",
    "out",
    ".next",
    ".nuxt",
    "__pycache__",
    ".pytest_cache",
    ".mypy_cache",
    "venv",
    ".venv",
    "env",
    "target",
    "vendor",
    "coverage",
    ".idea",
    ".vscode",
    ".gradle",
    "bin",
    "obj",
    ".DS_Store",
])

/** Browser-safety caps (NOT the grading rule — the BE enforces the real PIN §6 caps). */
const MAX_TOTAL_BYTES = 50 * 1024 * 1024
const MAX_FILE_COUNT = 2000

/** Normalizes a path to POSIX separators and strips a leading `./`. */
const toPosixPath = (path: string): string =>
    path.replace(/\\/g, "/").replace(/^\.\//, "")

/**
 * True when a path should be dropped from the submitted zip / preview: a directory
 * placeholder (trailing `/`), a hidden dotfile-only path we never want, or any path whose
 * segments include a {@link NOISE_DIRECTORIES} entry.
 */
const isNoisePath = (path: string): boolean => {
    if (path === "" || path.endsWith("/")) {
        return true
    }
    return path.split("/").some((segment) => NOISE_DIRECTORIES.has(segment))
}

/** Wraps fflate `unzip` (callback) in a Promise. */
const unzipAsync = (data: Uint8Array): Promise<Record<string, Uint8Array>> =>
    new Promise((resolve, reject) => {
        unzip(data, (error, unzipped) => {
            if (error) {
                reject(new ProjectArchiveError("read", error.message))
                return
            }
            resolve(unzipped)
        })
    })

/** Wraps fflate `zip` (callback) in a Promise. */
const zipAsync = (files: Record<string, Uint8Array>): Promise<Uint8Array> =>
    new Promise((resolve, reject) => {
        zip(files, { level: 6 }, (error, out) => {
            if (error) {
                reject(new ProjectArchiveError("read", error.message))
                return
            }
            resolve(out)
        })
    })

/**
 * Builds the sorted-paths + size map preview shape from a `path → bytes` record, applying
 * the noise filter and the browser-safety caps. Throws {@link ProjectArchiveError} on an
 * empty or over-cap project so the caller can surface the right message.
 *
 * @param entries - The raw `path → file bytes` map (from an unzip or a folder read).
 * @returns The filtered `{ paths, sizeByPath }` used by both the preview and (re-)zip.
 */
const summarize = (
    entries: Record<string, Uint8Array>,
): { paths: Array<string>, sizeByPath: Record<string, number> } => {
    const sizeByPath: Record<string, number> = {}
    let totalBytes = 0
    for (const [rawPath, bytes] of Object.entries(entries)) {
        const path = toPosixPath(rawPath)
        if (isNoisePath(path)) {
            continue
        }
        sizeByPath[path] = bytes.length
        totalBytes += bytes.length
    }
    const paths = Object.keys(sizeByPath).sort((a, b) => a.localeCompare(b))
    if (paths.length === 0) {
        throw new ProjectArchiveError("empty")
    }
    if (paths.length > MAX_FILE_COUNT || totalBytes > MAX_TOTAL_BYTES) {
        throw new ProjectArchiveError("too-large")
    }
    return { paths, sizeByPath }
}

/**
 * Prepares a picked `.zip` file: unzips it in-browser to enumerate the tree, and reuses
 * the picked file itself as the submitted blob (it is already a valid zip — no re-zip).
 *
 * @param file - The learner-picked `.zip` File.
 * @returns The {@link PreparedProject} (blob = the file, paths from its entries).
 */
export const prepareZipProject = async (file: File): Promise<PreparedProject> => {
    let bytes: Uint8Array
    try {
        bytes = new Uint8Array(await file.arrayBuffer())
    } catch (error) {
        throw new ProjectArchiveError("read", error instanceof Error ? error.message : undefined)
    }
    const entries = await unzipAsync(bytes)
    // Drop directory placeholders BEFORE summarizing (unzip emits `dir/` keys with 0 bytes).
    const fileEntries: Record<string, Uint8Array> = {}
    for (const [path, content] of Object.entries(entries)) {
        if (!path.endsWith("/")) {
            fileEntries[path] = content
        }
    }
    const { paths, sizeByPath } = summarize(fileEntries)
    return { blob: file, fileName: file.name, paths, sizeByPath }
}

/**
 * Prepares a picked folder (`<input webkitdirectory>`): reads every file, drops the noise
 * directories, and zips the survivors into ONE `.zip` Blob with fflate. Paths keep the
 * browser's `webkitRelativePath` (project-relative, includes the picked folder as root).
 *
 * @param files - The `FileList` (or array) the webkitdirectory input produced.
 * @returns The {@link PreparedProject} (blob = a fresh zip, paths from the folder).
 */
export const prepareFolderProject = async (
    files: Array<File>,
): Promise<PreparedProject> => {
    const zipInput: Record<string, Uint8Array> = {}
    for (const file of files) {
        const path = toPosixPath(file.webkitRelativePath || file.name)
        if (isNoisePath(path)) {
            continue
        }
        try {
            zipInput[path] = new Uint8Array(await file.arrayBuffer())
        } catch (error) {
            throw new ProjectArchiveError("read", error instanceof Error ? error.message : undefined)
        }
    }
    // Validate + cap on the SAME filtered set that goes into the zip.
    const { paths, sizeByPath } = summarize(zipInput)
    // Derive the archive name from the picked folder's root segment when present.
    const rootSegment = paths[0]?.split("/")[0]
    const fileName = rootSegment && rootSegment.length > 0 ? `${rootSegment}.zip` : "project.zip"
    const zipped = await zipAsync(zipInput)
    // Copy into a standalone ArrayBuffer so the Blob is not a view over fflate's pooled buffer.
    const blob = new Blob([zipped.slice()], { type: "application/zip" })
    return { blob, fileName, paths, sizeByPath }
}
