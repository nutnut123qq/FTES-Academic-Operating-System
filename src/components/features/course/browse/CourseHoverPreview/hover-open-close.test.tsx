import React from "react"
import { act, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { Course } from "../../hooks/useQueryCoursesSwr"

/**
 * Component — the catalog hover-preview panel's OPEN/CLOSE lifecycle (change
 * `hover-preview-meta-and-timeout`, Fix 4).
 *
 * The panel opens the INSTANT the pointer is over the card (the 300ms open delay
 * was dropped in 96a3a4e — a quick hover never earned the panel) and then STAYs open the whole
 * time the pointer is over the card OR the panel — it must NOT close on any
 * timer, display OR grace. Closing is driven purely by WHERE the pointer went
 * (`relatedTarget`): still inside the card/panel → stay open; outside both (or
 * null, off the window) → close immediately, no lingering.
 *
 * `t` echoes the message key so assertions key off ids. `createPortal` is
 * neutralised to render the panel inline (jsdom-free positioning is irrelevant
 * to the open/close logic under test).
 */

vi.mock("next-intl", () => ({
    useTranslations: () => (key: string, params?: Record<string, unknown>) =>
        params ? `${key}:${JSON.stringify(params)}` : key,
    useFormatter: () => ({ dateTime: () => "date" }),
}))

vi.mock("@phosphor-icons/react", () => {
    const Icon = () => <span />
    return {
        CheckIcon: Icon,
        ShoppingCartIcon: Icon,
        StarIcon: Icon,
        TrashIcon: Icon,
        UsersIcon: Icon,
    }
})

vi.mock("@heroui/react", () => ({
    Button: ({ children, onPress }: { children: React.ReactNode; onPress?: () => void }) => (
        <button type="button" onClick={onPress}>
            {children}
        </button>
    ),
    Chip: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
    Typography: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
    cn: (...a: Array<unknown>) => a.filter(Boolean).join(" "),
}))

// Render the portal inline so the panel is queryable without a real body portal.
vi.mock("react-dom", async (importOriginal) => {
    const actual = await importOriginal<typeof import("react-dom")>()
    return { ...actual, createPortal: (node: React.ReactNode) => node }
})

vi.mock("swr", () => ({ default: () => ({ data: undefined }) }))
vi.mock("@/modules/api/rest/course", () => ({ getCourseDetail: vi.fn() }))
vi.mock("@/i18n/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }))
vi.mock("@/components/blocks/buttons/SaveButton", () => ({ SaveButton: () => <div /> }))
vi.mock("../../hooks/useCourseEnrollment", () => ({
    useCourseEnrollment: () => ({
        isEnrolled: false,
        canBuy: false,
        inCart: false,
        onAddToCart: vi.fn(),
        onRemoveFromCart: vi.fn(),
        isTogglingCart: false,
    }),
}))
vi.mock("../../hooks/useQueryMyEnrolledSlugsSwr", () => ({
    useQueryMyEnrolledSlugsSwr: () => ({ enrolledSlugs: new Set<string>() }),
}))

import { CourseHoverPreview } from "./index"

const course: Course = {
    id: "react-testing",
    code: "PRF192",
    name: "React Testing Panel",
    level: "intermediate",
    credits: 0,
    lessons: 29,
    category: "cat",
    rating: 4.8,
    enrollmentCount: 1200,
}

const renderPreview = () =>
    render(
        <CourseHoverPreview course={course}>
            <div>CARD BODY</div>
        </CourseHoverPreview>,
    )

/**
 * Fires the pointer events React synthesises onPointerEnter/Leave from.
 * `relatedTarget` is what the close path reads — where the pointer went — so
 * `leave` defaults to leaving for good (the body) and takes the destination
 * when the pointer is only crossing onto the panel.
 */
const enter = (el: Element) => fireEvent.pointerOver(el)
const leave = (el: Element, to: Node = document.body) =>
    fireEvent.pointerOut(el, { relatedTarget: to })
const advance = (ms: number) => act(() => { vi.advanceTimersByTime(ms) })

describe("CourseHoverPreview — opens on hover, closes on leave, never on a timer", () => {
    beforeEach(() => vi.useFakeTimers())
    afterEach(() => {
        vi.runOnlyPendingTimers()
        vi.useRealTimers()
    })

    it("opens the instant the pointer is over the card — no hover delay", () => {
        const { container } = renderPreview()
        const wrapper = container.firstElementChild as Element

        enter(wrapper)
        // no timer to wait out: a quick hover must show the panel right away, otherwise a
        // pointer that keeps moving never earns it at all
        expect(screen.getByText("React Testing Panel")).toBeTruthy()
    })

    it("stays open indefinitely while the pointer keeps hovering (no display timeout)", () => {
        const { container } = renderPreview()
        const wrapper = container.firstElementChild as Element

        enter(wrapper)
        expect(screen.getByText("React Testing Panel")).toBeTruthy()

        // hold the hover: advance far past any plausible display timeout with NO leave
        advance(30_000)
        expect(screen.getByText("React Testing Panel")).toBeTruthy()
    })

    it("closes the instant the pointer leaves for something outside — no grace", () => {
        const { container } = renderPreview()
        const wrapper = container.firstElementChild as Element

        enter(wrapper)
        expect(screen.getByText("React Testing Panel")).toBeTruthy()

        // gone on the leave itself: no timer to advance, nothing lingers
        leave(wrapper)
        expect(screen.queryByText("React Testing Panel")).toBeNull()
    })

    it("crossing between the panel and the card keeps it open (relatedTarget still inside)", () => {
        const { container } = renderPreview()
        const wrapper = container.firstElementChild as Element

        enter(wrapper)
        // [card, panel] — the panel is portaled in production, inline under the
        // mocked `createPortal` here; either way it carries the same leave handler.
        const card = wrapper.children[0]
        const panel = wrapper.children[1]

        // pointer moves off the panel but back ONTO the card → never left the region
        leave(panel, card)
        expect(screen.getByText("React Testing Panel")).toBeTruthy()
        // and it stays there: nothing is pending to dismiss it later
        advance(30_000)
        expect(screen.getByText("React Testing Panel")).toBeTruthy()

        // leaving the panel for something outside both does close it
        leave(panel)
        expect(screen.queryByText("React Testing Panel")).toBeNull()
    })
})
