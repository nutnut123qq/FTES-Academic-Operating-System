/**
 * How a PE exam paper can be shown, decided from what the contract actually carries.
 *
 * `useQueryPePaperSwr` hands over exactly three facts — `mimeType`, `originalFilename`
 * and `imageUrl` (an inline-renderable URL that is minted for PICTURES ONLY, because the
 * provider's `raw` bucket answers 401 for anything else). Everything the left pane does
 * follows from those, and the mapping lives here rather than inside the JSX so the
 * "what do we do with a .docx" question is answered in one testable place.
 */

/** What the left pane can render for the paper. */
export type PePaperKind =
    /** A photograph/scan of the sheet — the shared image viewer takes it. */
    | "IMAGE"
    /** A PDF — streamed from the BE and embedded, scrollable, in the frame. */
    | "PDF"
    /** DOC/DOCX/ZIP/… — no honest inline preview; offer the download instead. */
    | "UNSUPPORTED"
    /** The resource has no file version at all. */
    | "MISSING"

/** The three facts the preview query resolves. */
export interface PePaperFileFacts {
    /** MIME of the current version, `null` when the resource has no file yet. */
    mimeType: string | null
    /** Original filename — the fallback signal when the MIME is generic. */
    originalFilename: string | null
    /** Inline-renderable URL; only ever non-null for a picture. */
    imageUrl: string | null
}

/** Lower-cased extension of a filename (`"de-thi.PDF"` → `"pdf"`), `""` when there is none. */
const extensionOf = (filename: string | null): string => {
    if (!filename) {
        return ""
    }
    const dot = filename.lastIndexOf(".")
    return dot > -1 ? filename.slice(dot + 1).toLowerCase() : ""
}

/** Picture extensions that are worth trusting when the BE ships a generic MIME. */
const IMAGE_EXTENSIONS = ["png", "jpg", "jpeg", "webp", "gif", "bmp", "heic"]

/**
 * Decides how to show a paper.
 *
 * An image WITHOUT an `imageUrl` (the presign failed, or the BE never minted one)
 * deliberately degrades to `UNSUPPORTED` rather than `IMAGE`: there is nothing to point an
 * `<img>` at, and the download is the only thing that can still work.
 *
 * @param facts - What the preview query resolved — see {@link PePaperFileFacts}.
 * @returns The kind of left pane to render.
 */
export const classifyPePaperFile = (facts: PePaperFileFacts): PePaperKind => {
    const mime = facts.mimeType?.toLowerCase() ?? ""
    const extension = extensionOf(facts.originalFilename)

    if (mime === "" && extension === "" && !facts.imageUrl) {
        return "MISSING"
    }
    if (facts.imageUrl && (mime.startsWith("image/") || IMAGE_EXTENSIONS.includes(extension))) {
        return "IMAGE"
    }
    if (mime === "application/pdf" || mime === "application/x-pdf" || extension === "pdf") {
        return "PDF"
    }
    return "UNSUPPORTED"
}
