import React from "react"
import { act, cleanup, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { useOverlayStore } from "@/hooks/zustand/overlay/store"

/**
 * Component — {@link ContentAiFab}: the HOST for the lesson-scoped AI chat.
 *
 * This suite was rewritten when the circular "Ask FTES AI" button was retired
 * (change `mascot-assistant-floating-hub`): the floating mascot assistant is the
 * single AI entry point on every page now, and it opens this chat by flipping the
 * shared overlay store. With the button went its vertical DRAG — position capture,
 * threshold, clamping, `localStorage["contentAiFabBottom"]` persistence and the
 * swallow of the toggle React Aria fired at the end of a drag-release. Those tests
 * are gone WITH the feature, not because they were inconvenient.
 *
 * What is pinned instead is the contract the mascot depends on: (1) render by route
 * param, (2) the store — not a press — is what opens the chat, (3) nothing here is
 * reachable by pointer, keyboard or screen reader, so the page has exactly ONE AI
 * affordance, and (4) the mobile bottom-sheet branch.
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
    ArrowsOutIcon: () => <span />,
    ArrowsInIcon: () => <span />,
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
        // `className` is passed THROUGH (unlike the other HeroUI-only props): the
        // anchor's invisibility and inertness live in those classes, so a test that
        // stripped them could not tell an inert anchor from a visible button.
        const { isIconOnly, variant, excludeFromTabOrder, ...dom } = rest
        void isIconOnly
        void variant
        // Mirror react-aria: `excludeFromTabOrder` lands as `tabIndex={-1}` on the DOM
        // node, which is what makes the invisible popover anchor unreachable by Tab.
        return (
            <button
                type="button"
                onClick={onPress}
                {...(excludeFromTabOrder ? { tabIndex: -1 } : {})}
                {...dom}
            >
                {children}
            </button>
        )
    }
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
        return <div data-testid="popover" data-open={String(isOpen)}>{children}</div>
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
    const CloseButton = ({ onPress, ...rest }: { onPress?: () => void; [k: string]: unknown }) => {
        const { className, ...dom } = rest
        void className
        return <button type="button" onClick={onPress} {...dom} />
    }
    const Typography = ({ children }: { children?: React.ReactNode }) => <span>{children}</span>
    const cn = (...args: Array<unknown>) => args.filter(Boolean).join(" ")
    return { Button, CloseButton, Drawer, Popover, PopoverContent, Typography, cn }
})

import { ContentAiFab } from "./index"

/** Flip the shared overlay store the way the mascot assistant does. */
const openChatFromStore = () =>
    act(() => {
        useOverlayStore.setState((state) => ({ openMap: { ...state.openMap, contentAiChat: true } }))
    })

beforeEach(() => {
    h.contentId = "content-1"
    h.isMobile = false
    h.popoverOnOpenChange = undefined
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
        const { container } = render(<ContentAiFab />)
        expect(container.innerHTML).toBe("")
    })

    it("renders the chat host while a lesson is open", () => {
        render(<ContentAiFab />)
        expect(screen.getByTestId("popover")).toBeTruthy()
    })
})

describe("ContentAiFab — no AI affordance of its own", () => {
    it("no longer exposes the retired 'Ask FTES AI' button", () => {
        render(<ContentAiFab />)
        expect(screen.queryByLabelText("reader.ai.open")).toBeNull()
    })

    it("keeps the popover anchor out of reach of pointer, Tab and screen readers", () => {
        const { container } = render(<ContentAiFab />)
        // the anchor is the only <button> outside the (closed) panel
        const anchor = container.querySelector("button")
        expect(anchor).not.toBeNull()
        expect(anchor?.getAttribute("aria-hidden")).toBe("true")
        expect(anchor?.tabIndex).toBe(-1)
        expect(anchor?.className).toContain("pointer-events-none")
        expect(anchor?.className).toContain("opacity-0")
    })
})

describe("ContentAiFab — opened by the shared overlay store", () => {
    it("shows the chat body once the store opens it (desktop)", () => {
        render(<ContentAiFab />)
        expect(screen.getByTestId("popover").dataset.open).toBe("false")

        openChatFromStore()

        expect(screen.getByTestId("popover").dataset.open).toBe("true")
        expect(screen.getByTestId("chat-body")).toBeTruthy()
    })

    it("dismissing the popover writes the closed state back to the store", () => {
        render(<ContentAiFab />)
        openChatFromStore()

        act(() => h.popoverOnOpenChange?.(false))

        expect(useOverlayStore.getState().openMap.contentAiChat).toBe(false)
    })
})

describe("ContentAiFab — mobile bottom-sheet", () => {
    it("opens the drawer with the chat body when the store opens", () => {
        h.isMobile = true
        render(<ContentAiFab />)

        expect(screen.queryByTestId("drawer")).toBeNull()

        openChatFromStore()

        expect(screen.getByTestId("drawer")).toBeTruthy()
        expect(screen.getByTestId("chat-body")).toBeTruthy()
    })
})
