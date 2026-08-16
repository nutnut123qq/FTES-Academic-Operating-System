import React from "react"
import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

/**
 * Component — {@link ExamImageViewer}: the paging + zoom contract both practice surfaces
 * depend on.
 *
 * What is pinned here is exactly what the owner reported missing: the paging affordances
 * must EXIST and work (carets, counter, filmstrip, ←/→), the ends must not wrap, the
 * arrows must not fight the comment composer's caret, and the zoom must clamp and reset
 * per page. The pan maths lives in `examImageViewport.test.ts` — happy-dom reports every
 * layout box as 0, so the DOM cannot say anything true about dragging.
 *
 * `t` echoes the key, with any params appended after `#`, so assertions key off message ids.
 */

vi.mock("next-intl", () => ({
    useTranslations:
        () =>
            (key: string, params?: Record<string, unknown>) =>
                params ? `${key}#${Object.values(params).join(",")}` : key,
}))

/* Trang chữ render qua block Markdown của nhà. Import thật kéo theo `next-intl/navigation`
   (→ `next/navigation`), thứ môi trường test không resolve được — và cũng không liên quan gì tới
   hợp đồng đang được ghim ở đây. Thay bằng một hộp phẳng để vẫn khẳng định được "trang chữ hiện
   nội dung, không hiện ảnh". */
vi.mock("@/components/reuseable/MarkdownContent", () => ({
    MarkdownContent: ({ markdown }: { markdown: string }) => (
        <div data-testid="markdown">{markdown}</div>
    ),
}))

vi.mock("@heroui/react", () => ({
    Button: ({
        children,
        onPress,
        isDisabled,
        ...rest
    }: {
        children?: React.ReactNode
        onPress?: () => void
        isDisabled?: boolean
        [key: string]: unknown
    }) => (
        <button
            type="button"
            disabled={isDisabled}
            onClick={onPress}
            aria-label={rest["aria-label"] as string | undefined}
        >
            {children}
        </button>
    ),
    cn: (...args: Array<unknown>) => args.filter(Boolean).join(" "),
}))

import { ExamImageViewer, type ExamImageViewerImage } from "./index"

/** A three-page album. */
const album: Array<ExamImageViewerImage> = [
    { id: "a", imageUrl: "https://storage/a.jpg", badgeCount: 2 },
    { id: "b", imageUrl: "https://storage/b.jpg" },
    { id: "c", imageUrl: "https://storage/c.jpg" },
]

/** Renders the viewer with a spy on the paging callback. */
const setup = (index: number, images = album, loadedCount?: number) => {
    const onIndexChange = vi.fn()
    const view = render(
        <ExamImageViewer
            images={images}
            index={index}
            onIndexChange={onIndexChange}
            loadedCount={loadedCount}
        />,
    )
    return { onIndexChange, view }
}

const prevButton = () => screen.getByLabelText("practice.viewer.previous")
const nextButton = () => screen.getByLabelText("practice.viewer.next")

describe("ExamImageViewer — paging", () => {
    it("shows the carets and the n/total counter for a multi-page album", () => {
        setup(1)
        expect(prevButton()).toBeTruthy()
        expect(nextButton()).toBeTruthy()
        expect(screen.getByText("2/3")).toBeTruthy()
    })

    it("pages with the carets", () => {
        const { onIndexChange } = setup(1)
        fireEvent.click(nextButton())
        expect(onIndexChange).toHaveBeenCalledWith(2)
        fireEvent.click(prevButton())
        expect(onIndexChange).toHaveBeenCalledWith(0)
    })

    it("disables the caret at each end instead of wrapping around", () => {
        const first = setup(0)
        expect((prevButton() as HTMLButtonElement).disabled).toBe(true)
        fireEvent.click(prevButton())
        expect(first.onIndexChange).not.toHaveBeenCalled()
        first.view.unmount()

        const last = setup(2)
        expect((nextButton() as HTMLButtonElement).disabled).toBe(true)
        fireEvent.click(nextButton())
        expect(last.onIndexChange).not.toHaveBeenCalled()
    })

    it("pages with ← / →", () => {
        const { onIndexChange } = setup(1)
        fireEvent.keyDown(window, { key: "ArrowRight" })
        expect(onIndexChange).toHaveBeenCalledWith(2)
        fireEvent.keyDown(window, { key: "ArrowLeft" })
        expect(onIndexChange).toHaveBeenCalledWith(0)
    })

    it("stops at the ends on the keyboard too", () => {
        const { onIndexChange } = setup(0)
        fireEvent.keyDown(window, { key: "ArrowLeft" })
        expect(onIndexChange).not.toHaveBeenCalled()
    })

    it("leaves the arrows alone while the reader is typing a comment", () => {
        const { onIndexChange } = setup(1)
        const composer = document.createElement("textarea")
        document.body.appendChild(composer)
        fireEvent.keyDown(composer, { key: "ArrowRight" })
        expect(onIndexChange).not.toHaveBeenCalled()
        composer.remove()
    })

    it("jumps straight to a page from the filmstrip", () => {
        const { onIndexChange } = setup(0)
        fireEvent.click(screen.getByLabelText("practice.viewer.goToImage#3"))
        expect(onIndexChange).toHaveBeenCalledWith(2)
    })

    it("renders NO src for a thumbnail outside the caller's load window", () => {
        setup(0, album, 2)
        const thumbnails = screen
            .getAllByRole("button")
            .filter((node) => node.getAttribute("aria-label")?.startsWith("practice.viewer.goToImage"))
        expect(thumbnails).toHaveLength(3)
        expect(thumbnails[1].querySelector("img")).toBeTruthy()
        expect(thumbnails[2].querySelector("img")).toBeNull()
    })

    it("drops every paging affordance for a single-page paper", () => {
        setup(0, [album[0]])
        expect(screen.queryByLabelText("practice.viewer.previous")).toBeNull()
        expect(screen.queryByLabelText("practice.viewer.next")).toBeNull()
        expect(screen.queryByText("1/1")).toBeNull()
        expect(screen.queryByLabelText("practice.viewer.goToImage#1")).toBeNull()
    })

    it("renders nothing at all for an empty album", () => {
        const { view } = setup(0, [])
        expect(view.container.firstChild).toBeNull()
    })
})

describe("ExamImageViewer — text pages", () => {
    /** Album trộn: trang scan, trang chữ, trang scan. */
    const mixed: Array<ExamImageViewerImage> = [
        { id: "a", imageUrl: "https://storage/a.jpg" },
        {
            id: "t",
            imageUrl: null,
            kind: "TEXT",
            textContent: "**Câu 1.** 1 + 1 = ?",
            sourceFilename: "de-prf192.txt",
        },
        { id: "c", imageUrl: "https://storage/c.jpg" },
    ]

    it("renders the exam text instead of a picture", () => {
        setup(1, mixed)

        expect(screen.getByTestId("markdown").textContent).toContain("Câu 1.")
        // Sân khấu không được có ảnh nào: trang chữ không có url, và một <img src=""> là một
        // request hỏng + một ô ảnh vỡ trên màn hình học viên.
        expect(screen.queryByAltText(/practice\.viewer\.imageAlt/)).toBeNull()
    })

    it("keeps paging identical across mixed pages", () => {
        const { onIndexChange } = setup(1, mixed)

        fireEvent.click(screen.getByLabelText("practice.viewer.next"))

        expect(onIndexChange).toHaveBeenCalledWith(2)
    })

    it("labels the text page in the filmstrip by its source filename", () => {
        setup(0, mixed)

        expect(screen.getByText("de-prf192.txt")).toBeTruthy()
    })
})

describe("ExamImageViewer — zoom", () => {
    it("starts fitted, with zoom-out and fit disabled and nothing to pan", () => {
        setup(0)
        expect(screen.getByText("practice.viewer.zoomLevel#100")).toBeTruthy()
        expect((screen.getByLabelText("practice.viewer.zoomOut") as HTMLButtonElement).disabled).toBe(
            true,
        )
        expect((screen.getByLabelText("practice.viewer.fit") as HTMLButtonElement).disabled).toBe(true)
        expect(screen.queryByText("practice.viewer.panHint")).toBeNull()
    })

    it("magnifies in steps and offers the pan hint once the page overflows", () => {
        setup(0)
        fireEvent.click(screen.getByLabelText("practice.viewer.zoomIn"))
        expect(screen.getByText("practice.viewer.zoomLevel#150")).toBeTruthy()
        expect(screen.getByText("practice.viewer.panHint")).toBeTruthy()
        fireEvent.click(screen.getByLabelText("practice.viewer.zoomIn"))
        expect(screen.getByText("practice.viewer.zoomLevel#225")).toBeTruthy()
    })

    it("clamps at 600% and disables the + button there", () => {
        setup(0)
        for (let press = 0; press < 12; press += 1) {
            fireEvent.click(screen.getByLabelText("practice.viewer.zoomIn"))
        }
        expect(screen.getByText("practice.viewer.zoomLevel#600")).toBeTruthy()
        expect((screen.getByLabelText("practice.viewer.zoomIn") as HTMLButtonElement).disabled).toBe(
            true,
        )
    })

    it("snaps back to the fit from the fit control", () => {
        setup(0)
        fireEvent.click(screen.getByLabelText("practice.viewer.zoomIn"))
        fireEvent.click(screen.getByLabelText("practice.viewer.fit"))
        expect(screen.getByText("practice.viewer.zoomLevel#100")).toBeTruthy()
    })

    it("zooms from the keyboard (+ / - / 0)", () => {
        setup(0)
        fireEvent.keyDown(window, { key: "+" })
        expect(screen.getByText("practice.viewer.zoomLevel#150")).toBeTruthy()
        fireEvent.keyDown(window, { key: "-" })
        expect(screen.getByText("practice.viewer.zoomLevel#100")).toBeTruthy()
        fireEvent.keyDown(window, { key: "+" })
        fireEvent.keyDown(window, { key: "0" })
        expect(screen.getByText("practice.viewer.zoomLevel#100")).toBeTruthy()
    })

    it("resets the zoom when the album pages to another picture", () => {
        const { view } = setup(0)
        fireEvent.click(screen.getByLabelText("practice.viewer.zoomIn"))
        expect(screen.getByText("practice.viewer.zoomLevel#150")).toBeTruthy()
        view.rerender(
            <ExamImageViewer images={album} index={1} onIndexChange={() => undefined} />,
        )
        expect(screen.getByText("practice.viewer.zoomLevel#100")).toBeTruthy()
    })
})
