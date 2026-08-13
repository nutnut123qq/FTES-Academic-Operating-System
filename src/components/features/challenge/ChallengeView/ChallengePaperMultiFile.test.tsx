import React from "react"
import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

/**
 * Component — {@link ChallengePaper} reading a MULTI-FILE paper (`paperFiles`).
 *
 * A real PE paper is several files with different jobs: page images or a PDF the candidate
 * READS, plus a `.zip`/`.docx` template they DOWNLOAD and fill in. Three things are pinned
 * here, all of them decisions rather than styling:
 *
 * 1. **The split follows the BACKEND's role.** A file the server marked download-only is
 *    never embedded — not even when its name and MIME say picture — and the ones it marked
 *    viewable reach the shared viewer / document frame in the author's order.
 * 2. **A paper of nothing but templates shows no viewer at all**, and lists every file.
 * 3. **No attachment list ⇒ nothing changes.** The single-file behaviour pinned in
 *    `ChallengePaper.test.tsx` must survive the new prop being absent, so the two specs
 *    overlap deliberately on that one case.
 *
 * `t` echoes the key, with any params appended after `#`, so assertions key off message ids.
 */

vi.mock("next-intl", () => ({
    useTranslations:
        () =>
            (key: string, params?: Record<string, unknown>) =>
                params ? `${key}#${Object.values(params).join(",")}` : key,
    useLocale: () => "vi",
}))

vi.mock("@heroui/react", () => {
    const Typography = ({ children }: { children?: React.ReactNode }) => <span>{children}</span>
    return {
        Typography,
        Chip: ({ children }: { children?: React.ReactNode }) => <span>{children}</span>,
        Button: ({
            children,
            isDisabled,
        }: {
            children?: React.ReactNode
            isDisabled?: boolean
        }) => (
            <button type="button" disabled={isDisabled}>
                {children}
            </button>
        ),
        cn: (...args: Array<unknown>) => args.filter(Boolean).join(" "),
    }
})

vi.mock("@phosphor-icons/react", () => ({
    ArrowSquareOutIcon: () => <span />,
    DownloadSimpleIcon: () => <span />,
    FileXIcon: () => <span />,
    FileZipIcon: () => <span />,
    LockSimpleIcon: () => <span />,
    PaperclipIcon: () => <span />,
    UploadSimpleIcon: () => <span />,
}))

/** The shared viewer is stubbed down to WHAT IT WAS HANDED — the album order is the point. */
vi.mock("@/components/features/subject/ExamImageViewer", () => ({
    ExamImageViewer: ({
        images,
        loadedCount,
    }: {
        images: Array<{ id: string; imageUrl: string; caption?: string | null }>
        loadedCount?: number
    }) => (
        <div
            data-testid="exam-image-viewer"
            data-count={images.length}
            data-loaded={loadedCount ?? ""}
            data-ids={images.map((image) => image.id).join(",")}
        >
            {images.map((image) => (
                <span key={image.id}>{image.caption}</span>
            ))}
        </div>
    ),
}))

vi.mock("@/components/features/identity", () => ({
    UserLink: () => <span data-testid="user-link" />,
}))

vi.mock("./ChallengePaperCommentThread", () => ({
    ChallengePaperCommentThread: () => <div data-testid="challenge-comments" />,
}))

import { ChallengePaper } from "./ChallengePaper"
import type { ChallengePaperFileView } from "@/modules/api/rest/challenges/types"

/** Builds one `paperFiles` row — an image page unless overridden. */
const file = (over: Partial<ChallengePaperFileView> & { id: string }): ChallengePaperFileView => ({
    url: `https://storage/${over.id}.png`,
    mime: "image/png",
    filename: `${over.id}.png`,
    sizeBytes: 1024,
    role: "VIEW",
    sortOrder: 0,
    ...over,
})

/** The template a candidate downloads and fills in. */
const TEMPLATE: ChallengePaperFileView = {
    id: "tpl",
    url: "https://storage/template.zip",
    mime: "application/zip",
    filename: "PRF192-template.zip",
    sizeBytes: 2 * 1024 * 1024,
    role: "DOWNLOAD",
    sortOrder: 3,
}

/**
 * Renders the paper surface. `paperUrl`/`paperMime` describe the PRIMARY file of the set,
 * exactly as the BE keeps them.
 */
const setup = (
    paperFiles: Array<ChallengePaperFileView> | null,
    paper: { url: string | null; mime: string | null } = {
        url: "https://storage/p1.png",
        mime: "image/png",
    },
) =>
    render(
        <ChallengePaper
            paperUrl={paper.url}
            paperMime={paper.mime}
            paperFiles={paperFiles}
            title="PE PRF192"
        />,
    )

describe("ChallengePaper — pages plus a template", () => {
    const files = [
        file({ id: "p1", sortOrder: 0 }),
        file({ id: "p2", sortOrder: 1 }),
        file({ id: "p3", sortOrder: 2 }),
        TEMPLATE,
    ]

    it("reads the three pages inline, in order, as ONE paged album", () => {
        setup(files)
        const viewer = screen.getByTestId("exam-image-viewer")
        expect(viewer.getAttribute("data-count")).toBe("3")
        expect(viewer.getAttribute("data-ids")).toBe("p1,p2,p3")
    })

    it("captions each page with its own filename rather than one repeated label", () => {
        setup(files)
        expect(screen.getByText("p2.png")).toBeTruthy()
    })

    it("keeps the picture fetch window the album's, not all twenty scans on mount", () => {
        setup(files)
        expect(screen.getByTestId("exam-image-viewer").getAttribute("data-loaded")).toBe("5")
    })

    it("offers the template as an attachment — name, size and a link to the file", () => {
        setup(files)
        expect(screen.getByText("paper.attachments.title")).toBeTruthy()
        expect(screen.getByText("PRF192-template.zip")).toBeTruthy()
        expect(screen.getByText("2 MB")).toBeTruthy()
        const download = screen.getByText("paper.attachments.download").closest("a")
        expect(download?.getAttribute("href")).toBe("https://storage/template.zip")
    })

    it("never sends the template to the viewer", () => {
        setup(files)
        expect(screen.getByTestId("exam-image-viewer").getAttribute("data-ids")).not.toContain(
            "tpl",
        )
    })
})

describe("ChallengePaper — the backend's role is the authority", () => {
    it("does NOT embed a download-only file even when it looks like a picture", () => {
        // The trap is the realistic one: no usable MIME and a `.png` NAME, which is exactly
        // the case `paperKind` resolves to IMAGE from the extension. The server said
        // download-only, so it belongs in the attachments list and nowhere else.
        setup([
            file({ id: "p1", sortOrder: 0 }),
            {
                id: "trap",
                url: "https://storage/de-thi.png",
                mime: "application/octet-stream",
                filename: "de-thi.png",
                sizeBytes: 512,
                role: "DOWNLOAD",
                sortOrder: 1,
            },
        ])
        expect(screen.getByTestId("exam-image-viewer").getAttribute("data-ids")).toBe("p1")
        expect(screen.getByText("de-thi.png")).toBeTruthy()
        expect(
            screen.getByText("paper.attachments.download").closest("a")?.getAttribute("href"),
        ).toBe("https://storage/de-thi.png")
    })

    it("shows no inline viewer at all when every file is download-only, and lists them all", () => {
        const { container } = setup(
            [
                { ...TEMPLATE, id: "a", filename: "a.zip", sortOrder: 0 },
                {
                    ...TEMPLATE,
                    id: "b",
                    filename: "b.docx",
                    mime: "application/msword",
                    url: "https://storage/b.docx",
                    sortOrder: 1,
                },
            ],
            { url: "https://storage/a.zip", mime: "application/zip" },
        )
        expect(screen.queryByTestId("exam-image-viewer")).toBeNull()
        expect(container.querySelectorAll("iframe").length).toBe(0)
        expect(screen.getByText("a.zip")).toBeTruthy()
        expect(screen.getByText("b.docx")).toBeTruthy()
        // The archive card the single-file paper has always shown for a ZIP primary file.
        expect(screen.getByText("paper.archiveHint")).toBeTruthy()
    })
})

describe("ChallengePaper — mixed pages and documents", () => {
    it("keeps the author's order: pages, the PDF appendix, then the last page", () => {
        const { container } = setup([
            file({ id: "p1", sortOrder: 0 }),
            file({
                id: "appendix",
                sortOrder: 1,
                url: "https://storage/appendix.pdf",
                mime: "application/pdf",
                filename: "appendix.pdf",
            }),
            file({ id: "p2", sortOrder: 2 }),
        ])
        const viewers = screen.getAllByTestId("exam-image-viewer")
        expect(viewers.map((viewer) => viewer.getAttribute("data-ids"))).toEqual(["p1", "p2"])
        const frame = container.querySelector("iframe")
        expect(frame?.getAttribute("src")).toBe("https://storage/appendix.pdf")
        expect(frame?.getAttribute("title")).toBe("appendix.pdf")
    })
})

describe("ChallengePaper — no attachment list changes nothing", () => {
    it("falls back to the single paper when the BE sends none", () => {
        setup(null)
        const viewer = screen.getByTestId("exam-image-viewer")
        expect(viewer.getAttribute("data-count")).toBe("1")
        expect(viewer.getAttribute("data-ids")).toBe("https://storage/p1.png")
        expect(screen.queryByText("paper.attachments.title")).toBeNull()
    })

    it("does the same for an EMPTY list", () => {
        setup([])
        expect(screen.getByTestId("exam-image-viewer").getAttribute("data-count")).toBe("1")
        expect(screen.queryByText("paper.attachments.title")).toBeNull()
    })

    it("still renders nothing at all for a challenge with no paper", () => {
        const { container } = setup(null, { url: null, mime: null })
        expect(container.firstChild).toBeNull()
    })
})
