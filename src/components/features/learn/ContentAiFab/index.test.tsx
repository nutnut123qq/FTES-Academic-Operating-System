import React from "react"
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { useOverlayStore } from "@/hooks/zustand/overlay/store"

/**
 * Component — {@link ContentAiFab} (course-reliability-pass B.3): the draggable
 * desktop FAB. Pins (1) render-by-route-param (no `contentId` → nothing), (2)
 * the vertical drag: pointer-capture, threshold, clamping to
 * `[MIN_BOTTOM, innerHeight − TOP_GUARD]`, and persistence to
 * `localStorage["contentAiFabBottom"]` on release + restore on mount, (3) the
 * drag-release swallow: the popover toggle React Aria fires at the END of a
 * drag must NOT open the chat (but the next real press must), and (4) the
 * mobile bottom-sheet branch. `setPointerCapture`/`releasePointerCapture` are
 * mocked onto the element prototype (happy-dom lacks pointer capture) and the
 * REAL overlay store carries the open state.
 */

const h = vi.hoisted(() => ({
    contentId: "content-1" as string | undefined,
    isMobile: false,
    popoverOnOpenChange: undefined as ((next: boolean) => void) | undefined,
}))

vi.mock("next-intl", () => ({
    useTranslations: () => (key: string) => key,
}))

vi.mock("next/navigation", () => ({
    useParams: () => ({ contentId: h.contentId }),
}))

vi.mock("@/hooks/reuseables/useSmViewpoint", () => ({
    useSmViewpoint: () => ({ isMobile: h.isMobile, isTablet: h.isMobile, isDesktop: !h.isMobile }),
}))

vi.mock("@phosphor-icons/react", () => ({
    SparkleIcon: () => <span />,
}))

vi.mock("@/components/blocks/buttons/FloatingActionButton", () => ({
    FloatingActionButton: ({
        onPress,
        ariaLabel,
        children,
    }: {
        onPress?: () => void
        ariaLabel?: string
        children?: React.ReactNode
    }) => (
        <button type="button" aria-label={ariaLabel} onClick={onPress}>
            {children}
        </button>
    ),
}))

vi.mock("@/components/features/learn/ContentAiChat", () => ({
    ContentAiChat: () => <div data-testid="chat-body" />,
}))

vi.mock("@heroui/react", () => {
    const passthrough = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>
    const Button = ({
        children,
        onPress,
        ...rest
    }: {
        children?: React.ReactNode
        onPress?: () => void
        [k: string]: unknown
    }) => {
        const { isIconOnly, variant, className, ...dom } = rest
        void isIconOnly
        void variant
        void className
        return (
            <button type="button" onClick={onPress} {...dom}>
                {children}
            </button>
        )
    }
    // Capture `onOpenChange` so tests can replay the toggle React Aria fires
    // at the end of a drag-release.
    const Popover = ({
        children,
        isOpen,
        onOpenChange,
    }: {
        children?: React.ReactNode
        isOpen?: boolean
        onOpenChange?: (next: boolean) => void
    }) => {
        h.popoverOnOpenChange = onOpenChange
        return <div data-open={String(isOpen)}>{children}</div>
    }
    const PopoverContent = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>
    const Drawer = Object.assign(passthrough, {
        Backdrop: ({ isOpen, children }: { isOpen?: boolean; children?: React.ReactNode }) =>
            isOpen ? <div data-testid="drawer">{children}</div> : null,
        Content: passthrough,
        Dialog: passthrough,
        CloseTrigger: () => <div />,
        Header: passthrough,
        Heading: passthrough,
        Body: passthrough,
    })
    const Typography = ({ children }: { children?: React.ReactNode }) => <span>{children}</span>
    const cn = (...args: Array<unknown>) => args.filter(Boolean).join(" ")
    return { Button, Drawer, Popover, PopoverContent, Typography, cn }
})

import { ContentAiFab } from "./index"

// happy-dom elements have no pointer capture — mock it on the prototype.
const setPointerCapture = vi.fn()
const releasePointerCapture = vi.fn()

const fab = () => screen.getByLabelText("reader.ai.open")

beforeEach(() => {
    h.contentId = "content-1"
    h.isMobile = false
    h.popoverOnOpenChange = undefined
    Object.assign(HTMLElement.prototype, { setPointerCapture, releasePointerCapture })
    Object.defineProperty(window, "innerHeight", { value: 800, configurable: true, writable: true })
    window.localStorage.clear()
    useOverlayStore.setState((state) => ({
        openMap: { ...state.openMap, contentAiChat: false },
    }))
})

afterEach(() => {
    cleanup()
    vi.clearAllMocks()
})

describe("ContentAiFab — render by route param", () => {
    it("renders nothing without a contentId route param", () => {
        h.contentId = undefined
        render(<ContentAiFab />)
        expect(screen.queryByLabelText("reader.ai.open")).toBeNull()
    })

    it("renders the FAB at the default offset while a lesson is open", () => {
        render(<ContentAiFab />)
        expect(fab().style.bottom).toBe("96px")
    })
})

describe("ContentAiFab — drag-persist (desktop)", () => {
    it("restores the persisted bottom offset from localStorage on mount", () => {
        window.localStorage.setItem("contentAiFabBottom", "222")
        render(<ContentAiFab />)
        expect(fab().style.bottom).toBe("222px")
    })

    it("ignores a corrupt persisted value and keeps the default", () => {
        window.localStorage.setItem("contentAiFabBottom", "not-a-number")
        render(<ContentAiFab />)
        expect(fab().style.bottom).toBe("96px")
    })

    it("a drag beyond the threshold captures the pointer, moves the FAB, and persists on release", () => {
        render(<ContentAiFab />)

        fireEvent.pointerDown(fab(), { clientY: 500, pointerId: 7 })
        expect(setPointerCapture).toHaveBeenCalledWith(7)

        // 60px up → bottom 96 + 60
        fireEvent.pointerMove(fab(), { clientY: 440 })
        expect(fab().style.bottom).toBe("156px")

        fireEvent.pointerUp(fab(), { pointerId: 7 })
        expect(window.localStorage.getItem("contentAiFabBottom")).toBe("156")
        expect(releasePointerCapture).toHaveBeenCalledWith(7)
    })

    it("clamps the drag between MIN_BOTTOM and innerHeight − TOP_GUARD", () => {
        render(<ContentAiFab />)
        fireEvent.pointerDown(fab(), { clientY: 500, pointerId: 1 })

        // way past the top → 800 − 80
        fireEvent.pointerMove(fab(), { clientY: -10000 })
        expect(fab().style.bottom).toBe("720px")

        // way past the bottom → MIN_BOTTOM
        fireEvent.pointerMove(fab(), { clientY: 20000 })
        expect(fab().style.bottom).toBe("16px")
    })

    it("a plain press (micro-jitter under the threshold) opens the chat and persists nothing", () => {
        render(<ContentAiFab />)

        fireEvent.pointerDown(fab(), { clientY: 500, pointerId: 1 })
        fireEvent.pointerMove(fab(), { clientY: 497 })
        fireEvent.pointerUp(fab(), { pointerId: 1 })

        // React Aria fires the press toggle after pointer-up
        act(() => h.popoverOnOpenChange?.(true))

        expect(useOverlayStore.getState().openMap.contentAiChat).toBe(true)
        expect(window.localStorage.getItem("contentAiFabBottom")).toBeNull()
    })

    it("swallows the toggle fired at the END of a drag-release — the next real press opens", () => {
        render(<ContentAiFab />)

        fireEvent.pointerDown(fab(), { clientY: 500, pointerId: 1 })
        fireEvent.pointerMove(fab(), { clientY: 400 })
        fireEvent.pointerUp(fab(), { pointerId: 1 })

        // the drag-release toggle → swallowed, chat stays closed
        act(() => h.popoverOnOpenChange?.(true))
        expect(useOverlayStore.getState().openMap.contentAiChat).toBe(false)

        // the swallow consumes the flag — a following real press opens
        act(() => h.popoverOnOpenChange?.(true))
        expect(useOverlayStore.getState().openMap.contentAiChat).toBe(true)
    })
})

describe("ContentAiFab — mobile bottom-sheet", () => {
    it("opens the drawer with the chat body on press", () => {
        h.isMobile = true
        render(<ContentAiFab />)

        expect(screen.queryByTestId("drawer")).toBeNull()
        fireEvent.click(fab())

        expect(useOverlayStore.getState().openMap.contentAiChat).toBe(true)
        expect(screen.getByTestId("drawer")).toBeTruthy()
        expect(screen.getByTestId("chat-body")).toBeTruthy()
    })
})
