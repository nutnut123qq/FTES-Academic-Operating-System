/**
 * How a challenge's EXAM PAPER can be shown, decided from what the BE actually carries.
 *
 * `ChallengeView` hands over two facts — `paperUrl` and `paperMime` — and everything the
 * paper surface does follows from them. The mapping lives here rather than inside the JSX
 * so the "what do we do with a .docx" question is answered in one testable place (same
 * shape as the retired PE paper classifier it replaces).
 */

/** What the paper surface can render. */
export type ChallengePaperKind =
    /** A photograph/scan of the sheet — rendered inline, capped, openable full size. */
    | "IMAGE"
    /** A PDF — embedded in a scrollable frame, with an "open" escape hatch. */
    | "PDF"
    /**
     * A ZIP the author uploaded as the paper — typically a whole folder of source code
     * and documents. Deliberately its OWN kind rather than `UNSUPPORTED`: an archive is a
     * perfectly valid paper here, so it deserves "download the pack" wording instead of
     * the apologetic "can't preview this" copy. It is also the one kind that carries NO
     * watermark (archives cannot be stamped), so never imply otherwise.
     */
    | "ARCHIVE"
    /** DOC/DOCX/… — no honest inline preview; offer opening/downloading it instead. */
    | "UNSUPPORTED"
    /** The challenge ships no paper at all. */
    | "MISSING"

/** Picture extensions worth trusting when the BE ships no / a generic MIME. */
const IMAGE_EXTENSIONS = ["png", "jpg", "jpeg", "webp", "gif", "bmp", "heic", "avif"]

/**
 * Archive extensions. Only `.zip` is actually accepted on upload, but a paper carried over
 * from elsewhere may use a sibling format — classifying it as an archive still yields the
 * right affordance (download), which is all this kind decides.
 */
const ARCHIVE_EXTENSIONS = ["zip", "zipx", "rar", "7z", "tar", "gz", "tgz"]

/**
 * Lower-cased extension of a URL's last path segment (`".../de-thi.PDF?v=2"` → `"pdf"`),
 * `""` when there is none. Query string and hash are stripped first — a signed delivery
 * URL almost always carries one.
 *
 * @param url - the paper URL, or `null`.
 * @returns the extension without the dot, lower-cased.
 */
const extensionOf = (url: string | null): string => {
    if (!url) {
        return ""
    }
    const path = url.split(/[?#]/)[0] ?? ""
    const segment = path.slice(path.lastIndexOf("/") + 1)
    const dot = segment.lastIndexOf(".")
    return dot > -1 ? segment.slice(dot + 1).toLowerCase() : ""
}

/**
 * Decides how to show a challenge's exam paper.
 *
 * The MIME wins when it is meaningful; the URL extension is the fallback for the (common)
 * case where a storage provider returns `application/octet-stream` or nothing at all.
 *
 * @param paperUrl - the BE `ChallengeView.paperUrl`.
 * @param paperMime - the BE `ChallengeView.paperMime`.
 * @returns the kind of surface to render.
 */
export const classifyChallengePaper = (
    paperUrl: string | null | undefined,
    paperMime: string | null | undefined,
): ChallengePaperKind => {
    const url = paperUrl ?? ""
    if (url.trim() === "") {
        return "MISSING"
    }
    const mime = (paperMime ?? "").toLowerCase()
    const extension = extensionOf(url)

    if (mime.startsWith("image/") || (mime === "" && IMAGE_EXTENSIONS.includes(extension))) {
        return "IMAGE"
    }
    if (mime === "application/pdf" || mime === "application/x-pdf") {
        return "PDF"
    }
    if (mime === "" && extension === "pdf") {
        return "PDF"
    }
    // Browsers and operating systems disagree on the zip MIME, so accept the known spellings
    // and fall back to the extension — the same leniency the upload guard applies.
    if (
        mime === "application/zip"
        || mime === "application/x-zip-compressed"
        || mime === "multipart/x-zip"
        || (mime === "" && ARCHIVE_EXTENSIONS.includes(extension))
    ) {
        return "ARCHIVE"
    }
    // A generic binary MIME says nothing — let the extension decide before giving up.
    if (mime === "application/octet-stream" || mime === "binary/octet-stream") {
        if (IMAGE_EXTENSIONS.includes(extension)) {
            return "IMAGE"
        }
        if (extension === "pdf") {
            return "PDF"
        }
        if (ARCHIVE_EXTENSIONS.includes(extension)) {
            return "ARCHIVE"
        }
    }
    return "UNSUPPORTED"
}
