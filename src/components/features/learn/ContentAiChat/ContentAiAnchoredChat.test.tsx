import React from "react"
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { AnchorRect } from "@/hooks/zustand/overlay/store"
import { useOverlayStore } from "@/hooks/zustand/overlay/store"
import { useSelectionHintStore } from "../LessonReader/ContentAiSelectionAsk/hintStore"

/**
 * Component — {@link ContentAiAnchoredChat} (lesson-ai-chat-fixes task 3.5):
 * desktop placement of the selection-anchored panel (right → flip left → under,
 * clamped inside the viewport), the three dismissal paths (Escape / pointer-down
 * outside — ignoring portaled dropdown menus / header close), and the
 * intent-preservation rule (mounting must NOT clear the stored selection; only a
 * REAL lesson change dismisses). Plus the entry split in
 * {@link ContentAiSelectionAsk}: desktop opens the anchored panel with the rect
 * snapshot, mobile (mocked `matchMedia` at ≤ 640px) opens the FAB bottom-sheet
 * and the anchored panel never renders. The REAL overlay store carries
 * open-state/rect/selection; HeroUI/phosphor are mocked to trivial renderers.
 * happy-dom reports `offsetHeight` 0, so the panel height resolves to the
 * `maxHeight` cap (vh × 0.7) in every placement calculation.
 */

const h = vi.hoisted(() => ({
    contentId: "content-1" as string | undefined,
    isMobile: false,
}))

vi.mock("next-intl", () => ({
    useTranslations: () => (key: string) => key,
}))

vi.mock("next/navigation", () => ({
    useParams: () => ({ contentId: h.contentId }),
}))

vi.mock("@phosphor-icons/react", () => ({
    SparkleIcon: () => <span />,
}))

vi.mock("@heroui/react", () => {
    const Button = ({
        children,
        onPress,
        ...rest
    }: {
        children?: React.ReactNode
        onPress?: () => void
        [k: string]: unknown
    }) => {
        const { variant, size, className, ...dom } = rest
        void variant
        void size
        void className
        return (
            <button type="button" onClick={onPress} {...dom}>
                {children}
            </button>
        )
    }
    const CloseButton = ({ onPress, ...rest }: { onPress?: () => void; [k: string]: unknown }) => {
        const { className, ...dom } = rest
        void className
        return <button type="button" onClick={onPress} {...dom} />
    }
    const Typography = ({ children }: { children?: React.ReactNode }) => <span>{children}</span>
    return { Button, CloseButton, Typography }
})

// The panel body — not under test here.
vi.mock("@/components/features/learn/ContentAiChat", () => ({
    ContentAiChat: () => <div data-testid="chat-body" />,
}))

import { ContentAiAnchoredChat } from "./ContentAiAnchoredChat"
import { ContentAiSelectionAsk } from "../LessonReader/ContentAiSelectionAsk"

/** Fixed-size viewport for deterministic placement math. */
const setViewport = (width: number, height: number) => {
    Object.defineProperty(window, "innerWidth", { value: width, configurable: true, writable: true })
    Object.defineProperty(window, "innerHeight", { value: height, configurable: true, writable: true })
}

const makeRect = (overrides: Partial<AnchorRect> = {}): AnchorRect => ({
    top: 100,
    left: 100,
    right: 300,
    bottom: 120,
    width: 200,
    height: 20,
    ...overrides,
})

/** Stash the rect + flip the anchored overlay open (what `openAnchored(rect)` does). */
const openPanel = (rect: AnchorRect) => {
    useOverlayStore.setState((state) => ({
        contentAiAnchorRect: rect,
        openMap: { ...state.openMap, contentAiAnchored: true },
    }))
}

/**
 * Build `#lesson-article` with one paragraph and stub `window.getSelection` so
 * a `mouseup` inside the article yields a valid passage selection with a known
 * rect snapshot.
 */
const mountArticleWithSelection = () => {
    const article = document.createElement("div")
    article.id = "lesson-article"
    const paragraph = document.createElement("p")
    paragraph.textContent = "Đoạn văn đầy đủ bao quanh phần được bôi đen trong bài đọc."
    article.appendChild(paragraph)
    document.body.appendChild(article)

    const rect = { top: 200, left: 300, right: 500, bottom: 220, width: 200, height: 20 }
    const range = {
        commonAncestorContainer: paragraph.firstChild as Node,
        getBoundingClientRect: () => rect,
    }
    const selection = {
        isCollapsed: false,
        rangeCount: 1,
        getRangeAt: () => range,
        toString: () => "phần được bôi đen",
        removeAllRanges: vi.fn(),
    }
    vi.stubGlobal("getSelection", () => selection)
    return { rect, paragraph }
}

beforeEach(() => {
    h.contentId = "content-1"
    h.isMobile = false
    setViewport(1440, 900)
    // matchMedia mock — `isMobile` answers the (max-width: 640px) query only
    vi.stubGlobal(
        "matchMedia",
        vi.fn((query: string) => ({
            matches: query === "(max-width: 640px)" ? h.isMobile : false,
            media: query,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            addListener: vi.fn(),
            removeListener: vi.fn(),
            dispatchEvent: vi.fn(),
            onchange: null,
        })),
    )
    window.localStorage.clear()
    useSelectionHintStore.setState({ seen: true })
    useOverlayStore.setState((state) => ({
        openMap: { ...state.openMap, contentAiChat: false, contentAiAnchored: false },
        contentAiSelection: null,
        contentAiSelectionContext: null,
        contentAiAnchorRect: null,
    }))
})

afterEach(() => {
    cleanup()
    document.body.innerHTML = ""
    vi.unstubAllGlobals()
    vi.clearAllMocks()
})

describe("ContentAiAnchoredChat — placement (desktop)", () => {
    it("places the panel to the RIGHT of the rect when it fits", () => {
        openPanel(makeRect())
        render(<ContentAiAnchoredChat />)
        const dialog = screen.getByRole("dialog")
        // right + GAP(12) = 300 + 12
        expect(dialog.style.left).toBe("312px")
        expect(dialog.style.top).toBe("100px")
        expect(dialog.style.visibility).toBe("visible")
    })

    it("flips to the LEFT when the right edge would overflow", () => {
        openPanel(makeRect({ left: 1200, right: 1400 }))
        render(<ContentAiAnchoredChat />)
        const dialog = screen.getByRole("dialog")
        // left − GAP(12) − PANEL_WIDTH(360) = 1200 − 372
        expect(dialog.style.left).toBe("828px")
        expect(dialog.style.top).toBe("100px")
    })

    it("falls UNDER the rect (centered) when neither side fits", () => {
        setViewport(700, 900)
        openPanel(makeRect({ left: 150, right: 550, width: 400 }))
        render(<ContentAiAnchoredChat />)
        const dialog = screen.getByRole("dialog")
        // center 350 − PANEL_WIDTH/2 = 170; top = bottom(120) + GAP(12)
        expect(dialog.style.left).toBe("170px")
        expect(dialog.style.top).toBe("132px")
    })

    it("clamps the top so the panel stays inside the viewport", () => {
        openPanel(makeRect({ top: 880, bottom: 890 }))
        render(<ContentAiAnchoredChat />)
        const dialog = screen.getByRole("dialog")
        // height = maxHeight = 900 × 0.7 = 630 → top clamp = 900 − 630 − MARGIN(8)
        expect(dialog.style.top).toBe("262px")
    })
})

describe("ContentAiAnchoredChat — dismissal", () => {
    it("Escape closes the panel, clears the rect AND the passage selection", () => {
        useOverlayStore.setState({ contentAiSelection: "đoạn", contentAiSelectionContext: "ctx" })
        openPanel(makeRect())
        render(<ContentAiAnchoredChat />)
        expect(screen.getByRole("dialog")).toBeTruthy()

        fireEvent.keyDown(document, { key: "Escape" })

        expect(screen.queryByRole("dialog")).toBeNull()
        const state = useOverlayStore.getState()
        expect(state.openMap.contentAiAnchored).toBe(false)
        expect(state.contentAiAnchorRect).toBeNull()
        expect(state.contentAiSelection).toBeNull()
    })

    it("pointer-down INSIDE or on a portaled dropdown menu keeps it open; OUTSIDE dismisses", () => {
        openPanel(makeRect())
        render(<ContentAiAnchoredChat />)
        const dialog = screen.getByRole("dialog")

        fireEvent.pointerDown(dialog)
        expect(screen.getByRole("dialog")).toBeTruthy()

        // the model picker's menu portals OUTSIDE the panel — must not count as outside
        const menu = document.createElement("div")
        menu.setAttribute("role", "menu")
        document.body.appendChild(menu)
        fireEvent.pointerDown(menu)
        expect(screen.getByRole("dialog")).toBeTruthy()

        const outside = document.createElement("div")
        document.body.appendChild(outside)
        fireEvent.pointerDown(outside)
        expect(screen.queryByRole("dialog")).toBeNull()
    })

    it("the header close button dismisses and clears the selection", () => {
        useOverlayStore.setState({ contentAiSelection: "đoạn" })
        openPanel(makeRect())
        render(<ContentAiAnchoredChat />)

        fireEvent.click(screen.getByLabelText("reader.ai.close"))

        expect(screen.queryByRole("dialog")).toBeNull()
        expect(useOverlayStore.getState().contentAiSelection).toBeNull()
    })

    it("mounting the OPEN panel does NOT reset the stored selection; a REAL lesson change dismisses", () => {
        h.contentId = "c1"
        useOverlayStore.setState({ contentAiSelection: "đoạn đã chọn" })
        openPanel(makeRect())
        const { rerender } = render(<ContentAiAnchoredChat />)

        // the intent set right before opening survives the mount
        expect(screen.getByRole("dialog")).toBeTruthy()
        expect(useOverlayStore.getState().contentAiSelection).toBe("đoạn đã chọn")

        h.contentId = "c2"
        rerender(<ContentAiAnchoredChat />)

        expect(screen.queryByRole("dialog")).toBeNull()
        expect(useOverlayStore.getState().contentAiSelection).toBeNull()
    })
})

describe("ContentAiSelectionAsk — desktop vs mobile entry (matchMedia)", () => {
    it("desktop: pressing ask opens the ANCHORED panel with the rect snapshot (not the FAB sheet)", () => {
        h.isMobile = false
        const { rect, paragraph } = mountArticleWithSelection()
        render(<ContentAiSelectionAsk />)

        fireEvent.mouseUp(document)
        fireEvent.click(screen.getByText("reader.askAboutThis"))

        const state = useOverlayStore.getState()
        expect(state.openMap.contentAiAnchored).toBe(true)
        expect(state.openMap.contentAiChat).toBe(false)
        expect(state.contentAiAnchorRect).toEqual(rect)
        expect(state.contentAiSelection).toBe("phần được bôi đen")
        expect(state.contentAiSelectionContext).toBe(paragraph.textContent)
    })

    it("mobile: pressing ask opens the FAB bottom-sheet and the anchored panel never renders", () => {
        h.isMobile = true
        mountArticleWithSelection()
        render(
            <>
                <ContentAiSelectionAsk />
                <ContentAiAnchoredChat />
            </>,
        )

        fireEvent.mouseUp(document)
        fireEvent.click(screen.getByText("reader.askAboutThis"))

        const state = useOverlayStore.getState()
        expect(state.openMap.contentAiChat).toBe(true)
        expect(state.openMap.contentAiAnchored).toBe(false)
        expect(state.contentAiAnchorRect).toBeNull()
        // mobile không render panel neo
        expect(screen.queryByRole("dialog")).toBeNull()
    })
})
