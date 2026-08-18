import React from "react"
import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

/**
 * Component — {@link ExamImageViewer}: the paging + zoom contract both practice surfaces
 * depend on.
 *
 * What is pinned here is exactly what the owner reported missing: the paging affordances
 * must EXIST and work (carets, counter, ←/→), the ends must WRAP (last → first, first →
 * last — the owner asked for it in those words, and the tests that used to pin the opposite
 * are inverted below rather than deleted), the arrows must not fight the comment composer's
 * caret, the zoom must clamp and reset per page, and full-screen mode must be reachable AND
 * escapable. The pan maths lives in `examImageViewport.test.ts` — happy-dom reports every
 * layout box as 0, so the DOM cannot say anything true about dragging.
 *
 * There is deliberately NOTHING here about a thumbnail filmstrip: it was removed because
 * scans of one exam look identical at thumbnail size (see the component docblock). What
 * survives of it is `loadedCount`, which now bounds only the next-page prefetch — pinned
 * below, because that bound is the only thing standing between a 200-scan album and a
 * couple of hundred megabytes of requests.
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
    { id: "a", imageUrl: "https://storage/a.jpg" },
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

    // Was "disables the caret at each end instead of wrapping around". The owner asked for
    // the loop ("ở trang cuối bấm nút qua phải thì quay về câu 1"), so the same two clicks
    // are still made — they now have to DO something, and neither caret may be inert.
    it("wraps at each end instead of disabling the caret", () => {
        const first = setup(0)
        expect((prevButton() as HTMLButtonElement).disabled).toBe(false)
        fireEvent.click(prevButton())
        expect(first.onIndexChange).toHaveBeenCalledWith(2)
        first.view.unmount()

        const last = setup(2)
        expect((nextButton() as HTMLButtonElement).disabled).toBe(false)
        fireEvent.click(nextButton())
        expect(last.onIndexChange).toHaveBeenCalledWith(0)
    })

    it("pages with ← / →", () => {
        const { onIndexChange } = setup(1)
        fireEvent.keyDown(window, { key: "ArrowRight" })
        expect(onIndexChange).toHaveBeenCalledWith(2)
        fireEvent.keyDown(window, { key: "ArrowLeft" })
        expect(onIndexChange).toHaveBeenCalledWith(0)
    })

    // Was "stops at the ends on the keyboard too". The keys go through the same
    // `goPrev`/`goNext` as the carets, and this is the test that keeps them agreeing.
    it("wraps at the ends on the keyboard too", () => {
        const first = setup(0)
        fireEvent.keyDown(window, { key: "ArrowLeft" })
        expect(first.onIndexChange).toHaveBeenCalledWith(2)
        first.view.unmount()

        const last = setup(2)
        fireEvent.keyDown(window, { key: "ArrowRight" })
        expect(last.onIndexChange).toHaveBeenCalledWith(0)
    })

    it("leaves the arrows alone while the reader is typing a comment", () => {
        const { onIndexChange } = setup(1)
        const composer = document.createElement("textarea")
        document.body.appendChild(composer)
        fireEvent.keyDown(composer, { key: "ArrowRight" })
        expect(onIndexChange).not.toHaveBeenCalled()
        composer.remove()
    })

    it("warms the NEXT picture so paging forward is instant", () => {
        const { view } = setup(0, album, 2)
        const prefetch = view.container.querySelector("img[aria-hidden='true']")
        expect(prefetch?.getAttribute("src")).toBe("https://storage/b.jpg")
    })

    it("fetches nothing past the caller's load window", () => {
        // The window is the ONLY brake on a 200-scan album: with it at 1 the reader is on the
        // only picture allowed, so the warm-up must not fire.
        const { view } = setup(0, album, 1)
        expect(view.container.querySelector("img[aria-hidden='true']")).toBeNull()
    })

    it("drops every paging affordance for a single-page paper", () => {
        setup(0, [album[0]])
        expect(screen.queryByLabelText("practice.viewer.previous")).toBeNull()
        expect(screen.queryByLabelText("practice.viewer.next")).toBeNull()
        expect(screen.queryByText("1/1")).toBeNull()
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

    it("pins the sheet to the light theme so dark mode does not print white on white", () => {
        // MarkdownContent tự gắn `text-foreground`; ở dark mode token đó gần trắng. Tờ giấy trắng
        // PHẢI mang scope theme sáng, nếu không trang đề trống trơn với người dùng dark mode — lỗi
        // không ai phát hiện được nếu chỉ xem ở light mode.
        const { view } = setup(1, mixed)

        const sheet = view.container.querySelector("[data-theme='light']")

        expect(sheet).not.toBeNull()
        expect(sheet?.textContent).toContain("Câu 1.")
    })

    it("counts a text page like any other, so the reader keeps one page number", () => {
        // Mixed albums used to be told apart by a filename on the filmstrip. With the strip
        // gone the counter is the whole story — and it must not skip or renumber text pages.
        setup(1, mixed)

        expect(screen.getByText("2/3")).toBeTruthy()
    })
})

describe("ExamImageViewer — full screen", () => {
    /** Renders with the expand pair wired, and hands back both spies. */
    const setupExpand = (
        props: Partial<React.ComponentProps<typeof ExamImageViewer>> = {},
    ) => {
        const onExpandedChange = vi.fn()
        const onCommentsHiddenChange = vi.fn()
        const view = render(
            <ExamImageViewer
                images={album}
                index={0}
                onIndexChange={vi.fn()}
                onExpandedChange={onExpandedChange}
                onCommentsHiddenChange={onCommentsHiddenChange}
                {...props}
            />,
        )
        return { onExpandedChange, onCommentsHiddenChange, view }
    }

    const expandButton = () => screen.queryByLabelText("practice.viewer.expand")
    const collapseButton = () => screen.queryByLabelText("practice.viewer.collapse")
    const hideCommentsButton = () => screen.queryByLabelText("practice.viewer.hideComments")
    const showCommentsButton = () => screen.queryByLabelText("practice.viewer.showComments")

    it("draws NO expand control when the host passed no handler", () => {
        // A host with nowhere to expand into (a viewer inside a dialog) must not get a
        // button that looks like it should fill the screen and then does nothing.
        setup(0)
        expect(screen.queryByLabelText("practice.viewer.expand")).toBeNull()
        expect(screen.queryByLabelText("practice.viewer.hideComments")).toBeNull()
    })

    it("asks the host to expand, and to collapse once expanded", () => {
        const docked = setupExpand()
        expect(collapseButton()).toBeNull()
        fireEvent.click(expandButton() as HTMLElement)
        expect(docked.onExpandedChange).toHaveBeenCalledWith(true)
        docked.view.unmount()

        const expanded = setupExpand({ isExpanded: true })
        expect(expandButton()).toBeNull()
        fireEvent.click(collapseButton() as HTMLElement)
        expect(expanded.onExpandedChange).toHaveBeenCalledWith(false)
    })

    it("offers the comments switch ONLY while expanded", () => {
        const docked = setupExpand()
        // Docked, the two panes share the page: dropping one would leave a hole, not width.
        expect(hideCommentsButton()).toBeNull()
        docked.view.unmount()

        setupExpand({ isExpanded: true })
        expect(hideCommentsButton()).not.toBeNull()
    })

    it("toggles the comments column both ways, starting from SHOWING", () => {
        const showing = setupExpand({ isExpanded: true })
        fireEvent.click(hideCommentsButton() as HTMLElement)
        expect(showing.onCommentsHiddenChange).toHaveBeenCalledWith(true)
        showing.view.unmount()

        const hidden = setupExpand({ isExpanded: true, areCommentsHidden: true })
        expect(hideCommentsButton()).toBeNull()
        fireEvent.click(showCommentsButton() as HTMLElement)
        expect(hidden.onCommentsHiddenChange).toHaveBeenCalledWith(false)
    })

    it("leaves full screen on Escape", () => {
        const { onExpandedChange } = setupExpand({ isExpanded: true })
        fireEvent.keyDown(window, { key: "Escape" })
        expect(onExpandedChange).toHaveBeenCalledWith(false)
    })

    it("leaves full screen on Escape even from inside the comment composer", () => {
        // The overlay covers the page, so the way out must not depend on where the caret is
        // — unlike the arrows, which the composer owns while typing.
        const { onExpandedChange } = setupExpand({ isExpanded: true })
        const composer = document.createElement("textarea")
        document.body.appendChild(composer)
        fireEvent.keyDown(composer, { key: "Escape" })
        expect(onExpandedChange).toHaveBeenCalledWith(false)
        composer.remove()
    })

    it("ignores Escape when nothing is expanded", () => {
        const { onExpandedChange } = setupExpand()
        fireEvent.keyDown(window, { key: "Escape" })
        expect(onExpandedChange).not.toHaveBeenCalled()
    })

    it("keeps zoom, paging and the counter working while expanded", () => {
        // The affordances an earlier bug left stranded outside the visible box: they must
        // all still be here, and still be the same controls.
        const { view } = setupExpand({ isExpanded: true, index: 1 })
        expect(screen.getByText("2/3")).toBeTruthy()
        expect(screen.getByLabelText("practice.viewer.previous")).toBeTruthy()
        expect(screen.getByLabelText("practice.viewer.next")).toBeTruthy()
        fireEvent.click(screen.getByLabelText("practice.viewer.zoomIn"))
        expect(screen.getByText("practice.viewer.zoomLevel#150")).toBeTruthy()
        view.unmount()
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
