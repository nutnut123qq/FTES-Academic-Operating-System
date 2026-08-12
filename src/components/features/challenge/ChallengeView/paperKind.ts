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
    /** DOC/DOCX/ZIP/… — no honest inline preview; offer opening/downloading it instead. */
    | "UNSUPPORTED"
    /** The challenge ships no paper at all. */
    | "MISSING"

/** Picture extensions worth trusting when the BE ships no / a generic MIME. */
const IMAGE_EXTENSIONS = ["png", "jpg", "jpeg", "webp", "gif", "bmp", "heic", "avif"]

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
    // A generic binary MIME says nothing — let the extension decide before giving up.
    if (mime === "application/octet-stream" || mime === "binary/octet-stream") {
        if (IMAGE_EXTENSIONS.includes(extension)) {
            return "IMAGE"
        }
        if (extension === "pdf") {
            return "PDF"
        }
    }
    return "UNSUPPORTED"
}
