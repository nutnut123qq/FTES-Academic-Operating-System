/**
 * How a challenge's exam paper — which is a SET of files, not one file — is laid out on
 * screen.
 *
 * The BE contract `challenge-paper-multifile` ships `ChallengeView.paperFiles`: every
 * attached file in the author's order, each already classified SERVER-SIDE as viewable in
 * place (`role === "VIEW"` — an `image/*` or a PDF the candidate reads) or download-only
 * (a `.zip`/`.docx`/`.xlsx` template they fill in). Splitting that list into "what the
 * reader looks at" and "what the reader downloads" is a decision, not markup, so it lives
 * here as a pure function next to {@link classifyChallengePaper} rather than inside the
 * JSX — one testable place for the question "where does this file go".
 *
 * **The role is the BE's to decide, never ours.** This module reads `role` and nothing
 * else to answer viewable-vs-download; it never looks at the filename or the extension for
 * that. {@link classifyChallengePaper} is still used, but only to pick HOW an
 * already-permitted file is rendered (picture vs document frame) — the same rules the
 * single-file paper has always used, unchanged.
 */

import type { ChallengePaperFileView } from "@/modules/api/rest/challenges/types"

import { classifyChallengePaper } from "./paperKind"

/**
 * The one `role` value that permits embedding a file in the page (BE `PaperFileRole.VIEW`).
 *
 * Compared EXACTLY, and everything else — including a role invented after this code was
 * written — falls through to download-only. The BE publishes `role` as a string precisely
 * so it can grow a third value without breaking clients; a client that treats "not
 * DOWNLOAD" as "safe to embed" would be the one thing that turns that into a breaking
 * change, and would embed a file the server said not to.
 */
const VIEWABLE_ROLE = "VIEW"

/**
 * One INLINE block of the paper, in the author's order.
 *
 * Consecutive pictures collapse into a single `IMAGES` run on purpose: the shared
 * `ExamImageViewer` is an ALBUM (carets, `n/total` counter, filmstrip, ←/→ keys, zoom and
 * pan), so a three-page photographed exam belongs in ONE viewer the reader pages through,
 * not three stacked viewers each with its own zoom state. A PDF cannot join that run — the
 * browser's own PDF viewer is a different frame — so it breaks the run and gets its own
 * section, which is what keeps "pages 1-2, a PDF appendix, then page 3" in the order the
 * author set it.
 */
export type ChallengePaperSection =
    /** A run of consecutive picture pages, shown as ONE paged album. */
    | { kind: "IMAGES"; files: Array<ChallengePaperFileView> }
    /** A single PDF, shown in its own embedded document frame. */
    | { kind: "DOCUMENT"; file: ChallengePaperFileView }

/** The paper split into what is read in place and what is downloaded. */
export interface ChallengePaperSet {
    /**
     * What the reader LOOKS at, in the author's order. Empty when the paper is nothing but
     * templates — a legitimate state, and the surface must then show no inline viewer at
     * all rather than an empty frame.
     */
    sections: Array<ChallengePaperSection>
    /**
     * What the reader DOWNLOADS, in the author's order: every file the BE marked
     * download-only, plus any viewable file this FE has no honest way to embed (see
     * {@link groupChallengePaperFiles}).
     */
    attachments: Array<ChallengePaperFileView>
}

/** An empty set — the shape a paper with no attachment list resolves to. */
const EMPTY_SET: ChallengePaperSet = { sections: [], attachments: [] }

/**
 * Splits a challenge's attached files into the inline sections and the download list.
 *
 * Order is the AUTHOR's: the list is sorted by `sortOrder` ascending (the BE already sends
 * it that way, but a caller that concatenated or re-fetched pages should not be able to
 * shuffle the exam), and ties keep their incoming order because `Array.prototype.sort` is
 * stable.
 *
 * Where each file lands:
 * - `role !== "VIEW"` → **attachments**. Full stop — a download-only file is never embedded,
 *   however picture-like its name looks.
 * - `role === "VIEW"` and {@link classifyChallengePaper} says `IMAGE` → joins the current
 *   picture run.
 * - `role === "VIEW"` and it says `PDF` → its own document section.
 * - `role === "VIEW"` and it says anything else → **attachments**. The BE only marks images
 *   and PDFs viewable, so this is unreachable on a healthy deployment; if it ever happens
 *   (an odd MIME, a newer server), offering the file to download is honest, whereas forcing
 *   it into a frame would render a broken preview of something the browser cannot show.
 * - A row with a blank URL is DROPPED entirely: there is neither anything to display nor
 *   anywhere to send the reader.
 *
 * @param files - the BE `ChallengeView.paperFiles`, or `null`/`undefined` on a deployment
 *   older than the contract.
 * @returns the sections to render inline and the files to offer for download; both empty
 *   when there is no attachment list, which is the caller's signal to fall back to the
 *   single-file paper fields.
 */
export const groupChallengePaperFiles = (
    files: ReadonlyArray<ChallengePaperFileView> | null | undefined,
): ChallengePaperSet => {
    if (!files || files.length === 0) {
        return EMPTY_SET
    }

    const ordered = [...files]
        .filter((file) => (file.url ?? "").trim() !== "")
        .sort((left, right) => left.sortOrder - right.sortOrder)

    const sections: Array<ChallengePaperSection> = []
    const attachments: Array<ChallengePaperFileView> = []

    for (const file of ordered) {
        if (file.role !== VIEWABLE_ROLE) {
            attachments.push(file)
            continue
        }

        const kind = classifyChallengePaper(file.url, file.mime)
        if (kind === "IMAGE") {
            const last = sections[sections.length - 1]
            if (last?.kind === "IMAGES") {
                last.files.push(file)
            } else {
                sections.push({ kind: "IMAGES", files: [file] })
            }
            continue
        }
        if (kind === "PDF") {
            sections.push({ kind: "DOCUMENT", file })
            continue
        }
        attachments.push(file)
    }

    return { sections, attachments }
}
