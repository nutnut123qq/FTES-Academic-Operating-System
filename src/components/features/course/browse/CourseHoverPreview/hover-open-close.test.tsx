import React from "react"
import { act, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { Course } from "../../hooks/useQueryCoursesSwr"

/**
 * Component — the catalog hover-preview panel's OPEN/CLOSE lifecycle (change
 * `hover-preview-meta-and-timeout`, Fix 4).
 *
 * The panel must open on hover after a short delay and then STAY open the whole
 * time the pointer is over the card — it must NOT close on any fixed display
 * timer. It closes only after the pointer leaves, and only past a short grace
 * that a re-enter cancels. These tests drive the wrapper's pointer events with
 * fake timers and assert the panel never self-dismisses while hovered.
 *
 * `t` echoes the message key so assertions key off ids. `createPortal` is
 * neutralised to render the panel inline (jsdom-free positioning is irrelevant
 * to the open/close logic under test).
 */

const OPEN_DELAY_MS = 300
const CLOSE_DELAY_MS = 150

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

/** Fires the pointer events React synthesises onPointerEnter/Leave from. */
const enter = (el: Element) => act(() => { fireEvent.pointerOver(el) })
const leave = (el: Element) => act(() => { fireEvent.pointerOut(el, { relatedTarget: document.body }) })
const advance = (ms: number) => act(() => { vi.advanceTimersByTime(ms) })

describe("CourseHoverPreview — opens on hover, never closes on a timer while hovered", () => {
    beforeEach(() => vi.useFakeTimers())
    afterEach(() => {
        vi.runOnlyPendingTimers()
        vi.useRealTimers()
    })

    it("opens only after the hover delay", () => {
        const { container } = renderPreview()
        const wrapper = container.firstElementChild as Element

        enter(wrapper)
        // before the open delay elapses, nothing has popped up
        expect(screen.queryByText("React Testing Panel")).toBeNull()
        advance(OPEN_DELAY_MS)
        expect(screen.getByText("React Testing Panel")).toBeTruthy()
    })

    it("stays open indefinitely while the pointer keeps hovering (no display timeout)", () => {
        const { container } = renderPreview()
        const wrapper = container.firstElementChild as Element

        enter(wrapper)
        advance(OPEN_DELAY_MS)
        expect(screen.getByText("React Testing Panel")).toBeTruthy()

        // hold the hover: advance far past any plausible display timeout with NO leave
        advance(30_000)
        expect(screen.getByText("React Testing Panel")).toBeTruthy()
    })

    it("closes only after the pointer leaves, past the grace delay", () => {
        const { container } = renderPreview()
        const wrapper = container.firstElementChild as Element

        enter(wrapper)
        advance(OPEN_DELAY_MS)
        expect(screen.getByText("React Testing Panel")).toBeTruthy()

        leave(wrapper)
        advance(0)
        // still open during the grace window
        advance(CLOSE_DELAY_MS - 50)
        expect(screen.getByText("React Testing Panel")).toBeTruthy()
        // closed once the grace elapses
        advance(60)
        expect(screen.queryByText("React Testing Panel")).toBeNull()
    })

    it("re-entering within the grace cancels the pending close", () => {
        const { container } = renderPreview()
        const wrapper = container.firstElementChild as Element

        enter(wrapper)
        advance(OPEN_DELAY_MS)
        leave(wrapper)
        advance(0)
        advance(CLOSE_DELAY_MS - 60)
        // pointer comes back before the grace elapses → close is cancelled
        enter(wrapper)
        advance(0)
        advance(CLOSE_DELAY_MS + 100)
        expect(screen.getByText("React Testing Panel")).toBeTruthy()
    })
})
