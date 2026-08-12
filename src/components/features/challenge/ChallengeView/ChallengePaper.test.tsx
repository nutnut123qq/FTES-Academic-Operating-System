import React from "react"
import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

/**
 * Component — {@link ChallengePaper}: the two-pane PE paper surface of a `pe`-tagged
 * challenge.
 *
 * Two things are pinned, because both are decisions rather than styling:
 *
 * 1. **Which LEFT pane a paper gets.** A photographed sheet must reach the SHARED
 *    `ExamImageViewer` (zoom/pan already solved there) and be handed exactly ONE image —
 *    the challenge contract carries a single `paperUrl`, and a fabricated multi-page array
 *    would make the viewer offer carets for pages that do not exist. A PDF keeps the
 *    embedded frame, an archive and an unknown format keep their own cards, and a paperless
 *    challenge renders nothing at all so the caller can fall back to the solve surface.
 *
 * 2. **The hand-in block is present and DEAD.** AI grading for papers is unsold, so the
 *    right column must be laid out (so unlocking is a flag, not a redesign) yet impossible
 *    to start: the action disabled, the reason stated, and — the part that actually
 *    matters — no file input anywhere in the tree.
 *
 * `t` echoes the key, with any params appended after `#`, so assertions key off message ids.
 */

vi.mock("next-intl", () => ({
    useTranslations:
        () =>
            (key: string, params?: Record<string, unknown>) =>
                params ? `${key}#${Object.values(params).join(",")}` : key,
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
    FileXIcon: () => <span />,
    FileZipIcon: () => <span />,
    LockSimpleIcon: () => <span />,
    UploadSimpleIcon: () => <span />,
}))

/**
 * The shared viewer is stubbed down to what it was HANDED: this spec is about branch
 * selection and the single-image contract, while the viewer's own paging/zoom behaviour is
 * pinned in `ExamImageViewer/index.test.tsx`.
 */
vi.mock("@/components/features/subject/ExamImageViewer", () => ({
    ExamImageViewer: ({ images }: { images: Array<{ id: string; imageUrl: string }> }) => (
        <div data-testid="exam-image-viewer" data-count={images.length}>
            {images.map((image) => (
                <span key={image.id}>{image.imageUrl}</span>
            ))}
        </div>
    ),
}))

import { ChallengePaper, IS_PAPER_GRADING_OPEN } from "./ChallengePaper"

/** Renders the paper surface for one BE (`paperUrl`, `paperMime`) pair. */
const setup = (paperUrl: string | null, paperMime: string | null) =>
    render(<ChallengePaper paperUrl={paperUrl} paperMime={paperMime} title="PE PRF192" />)

describe("ChallengePaper — left pane by paper kind", () => {
    it("sends a photographed sheet to the SHARED viewer, as exactly one image", () => {
        setup("https://storage/de-pe.jpg", "image/png")
        const viewer = screen.getByTestId("exam-image-viewer")
        expect(viewer.getAttribute("data-count")).toBe("1")
        expect(screen.getByText("https://storage/de-pe.jpg")).toBeTruthy()
    })

    it("classifies from the URL when the BE ships no MIME, and still uses the viewer", () => {
        setup("https://storage/de-pe.webp?sig=abc", null)
        expect(screen.getByTestId("exam-image-viewer")).toBeTruthy()
    })

    it("keeps the embedded frame for a PDF instead of the picture viewer", () => {
        const { container } = setup("https://storage/de-pe.pdf", "application/pdf")
        expect(screen.queryByTestId("exam-image-viewer")).toBeNull()
        const frame = container.querySelector("iframe")
        expect(frame?.getAttribute("src")).toBe("https://storage/de-pe.pdf")
    })

    it("keeps the download card for an archive — not the failure copy", () => {
        setup("https://storage/de-pe.zip", "application/zip")
        expect(screen.getByText("paper.archiveHint")).toBeTruthy()
        expect(screen.queryByText("paper.noPreview")).toBeNull()
        expect(screen.queryByTestId("exam-image-viewer")).toBeNull()
    })

    it("says plainly that an unshowable format cannot be rendered inline", () => {
        setup("https://storage/de-pe.docx", "application/msword")
        expect(screen.getByText("paper.noPreview")).toBeTruthy()
        expect(screen.queryByTestId("exam-image-viewer")).toBeNull()
    })

    it("renders nothing for a challenge that carries no paper", () => {
        const { container } = setup(null, "image/png")
        expect(container.firstChild).toBeNull()
    })

    it("always offers the escape hatch to the original file", () => {
        const { container } = setup("https://storage/de-pe.docx", "application/msword")
        expect(container.querySelector("a")?.getAttribute("href")).toBe(
            "https://storage/de-pe.docx",
        )
        expect(screen.getByText("paper.open")).toBeTruthy()
    })
})

describe("ChallengePaper — the gated hand-in column", () => {
    it("is still SOLD LATER — the flag the column is built around stays off", () => {
        expect(IS_PAPER_GRADING_OPEN).toBe(false)
    })

    it("renders the hand-in block next to the paper, with its reason", () => {
        setup("https://storage/de-pe.jpg", "image/png")
        expect(screen.getByText("paper.submit.title")).toBeTruthy()
        expect(screen.getByText("paper.submit.dropzone")).toBeTruthy()
        expect(screen.getByText("paper.submit.lockedBadge")).toBeTruthy()
        expect(screen.getByText("paper.gradingLocked")).toBeTruthy()
    })

    it("cannot be started: the action is disabled and no file input exists", () => {
        const { container } = setup("https://storage/de-pe.pdf", "application/pdf")
        const action = screen.getByText("paper.submit.cta").closest("button")
        expect((action as HTMLButtonElement).disabled).toBe(true)
        expect(container.querySelector("input")).toBeNull()
        expect(container.querySelector("form")).toBeNull()
    })

    it("accompanies every paper kind, not just the ones with a viewer", () => {
        setup("https://storage/de-pe.docx", "application/msword")
        expect(screen.getByText("paper.submit.title")).toBeTruthy()
    })
})
