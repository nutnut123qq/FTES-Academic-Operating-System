import React from "react"
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

/**
 * Component — {@link MascotAssistant}: how the corner mascot's option panel OPENS
 * and CLOSES.
 *
 * This suite exists because the hover entry point was shipped, then deleted, then
 * asked for back. Commit bb81af42 ("vá 21/23 mục góp ý người dùng", task 1.4)
 * removed `onPointerEnter` / `onPointerLeave` / the close timer outright to answer
 * góp ý #5 — "pointing at the mascot and clicking it turns the assistant off" —
 * and with them went the only way to open the panel with a mouse. Nothing failed:
 * there was no test on this component at all, so a whole affordance vanished
 * silently and only a human noticed, a day later.
 *
 * So what is pinned here is the FULL open/close matrix, not just "hover opens":
 *  1. mouse hover opens the panel,
 *  2. a click on a HOVER-opened panel ADOPTS it instead of closing it — that is
 *     góp ý #5, and it is the reason a naive revert would be wrong,
 *  3. a SECOND click does close it,
 *  4. a hover-opened panel closes on its own once the mouse leaves and the grace
 *     period lapses, and returning inside the grace cancels that,
 *  5. a CLICK-opened panel is NOT on that timer,
 *  6. touch never hovers, so one tap opens and one tap closes (a `pointerenter`
 *     that ignored `pointerType` would toggle twice and the panel would never
 *     open on a phone).
 *
 * NOT covered here: the pose. The mascot's placement is a solved set of coupled
 * transform offsets that crop the character against the viewport edge, and neither
 * happy-dom nor jsdom computes layout — a geometric regression (the visible pixels
 * drifting off the hit box) cannot be seen from here and was ruled out in a real
 * browser instead.
 */

const h = vi.hoisted(() => ({
    pathname: "/" as string | null,
    tourActive: false,
    consentDecided: true as boolean | null,
    push: vi.fn(),
    openLessonChat: vi.fn(),
}))

vi.mock("next-intl", () => ({
    useTranslations: () => (key: string) => key,
}))

vi.mock("@/i18n/navigation", () => ({
    usePathname: () => h.pathname,
    useRouter: () => ({ push: h.push }),
    Link: ({ children, href, ...rest }: { children?: React.ReactNode; href?: string; [k: string]: unknown }) => (
        <a href={href} {...rest}>
            {children}
        </a>
    ),
}))

vi.mock("@/components/features/onboarding", () => ({
    useTour: () => ({ isActive: h.tourActive }),
}))

vi.mock("@/hooks/zustand/cookieConsent/store", () => ({
    useCookieConsentStore: (selector: (state: { decided: boolean | null }) => unknown) =>
        selector({ decided: h.consentDecided }),
}))

vi.mock("@/hooks/zustand/overlay/hooks", () => ({
    useContentAiChatOverlayState: () => ({ open: h.openLessonChat }),
}))

vi.mock("@heroui/react", () => ({
    cn: (...parts: unknown[]) => parts.filter(Boolean).join(" "),
}))

const { MascotAssistant } = await import("./MascotAssistant")

/** The mascot itself — the button that opens the panel. */
const toggle = () => screen.getByTestId("mascot-assistant-toggle")
/** The whole assistant region: mascot + panel. Enter/leave are bound HERE. */
const shell = () => screen.getByTestId("mascot-assistant")
/** `aria-expanded` is the component's own public statement about the panel. */
const isOpen = () => toggle().getAttribute("aria-expanded") === "true"

/**
 * One gesture, one `act`. Batching several `fireEvent`s into a single `act` would
 * be a lie about how they reach the component: React would coalesce them into one
 * render, so the second handler would still close over the FIRST one's `isOpen` and
 * the click branches would be picked on stale state. Real gestures arrive in
 * separate turns of the event loop, which is what this reproduces.
 */
const gesture = (fire: () => void) => {
    act(() => {
        fire()
    })
}

const mouseEnter = () => gesture(() => fireEvent.pointerEnter(shell(), { pointerType: "mouse" }))
const mouseLeave = () => gesture(() => fireEvent.pointerLeave(shell(), { pointerType: "mouse" }))
const clickMascot = () => gesture(() => fireEvent.click(toggle()))
const tick = (ms: number) => {
    act(() => {
        vi.advanceTimersByTime(ms)
    })
}

beforeEach(() => {
    vi.useFakeTimers()
    h.pathname = "/"
    h.tourActive = false
    h.consentDecided = true
    h.push.mockReset()
    h.openLessonChat.mockReset()
})

afterEach(() => {
    cleanup()
    vi.useRealTimers()
})

describe("MascotAssistant — opening the panel", () => {
    it("opens on mouse hover (the entry point góp ý #5 removed)", () => {
        render(<MascotAssistant />)
        expect(isOpen()).toBe(false)

        mouseEnter()

        expect(isOpen()).toBe(true)
        expect(screen.getByRole("navigation")).toBeTruthy()
    })

    it("ignores a non-mouse pointer, so a tap does not open then toggle shut", () => {
        render(<MascotAssistant />)

        gesture(() => fireEvent.pointerEnter(shell(), { pointerType: "touch" }))
        expect(isOpen()).toBe(false)

        // The tap's click is what opens it — exactly once.
        clickMascot()
        expect(isOpen()).toBe(true)

        clickMascot()
        expect(isOpen()).toBe(false)
    })

    it("still opens on a plain click when the pointer never hovered (keyboard Enter)", () => {
        render(<MascotAssistant />)

        clickMascot()

        expect(isOpen()).toBe(true)
    })
})

describe("MascotAssistant — clicking a hover-opened panel (góp ý #5)", () => {
    it("does NOT close on the reflex click that follows the hover", () => {
        render(<MascotAssistant />)

        mouseEnter()
        expect(isOpen()).toBe(true)

        // Point at the mascot, then click it: the old toggle read this as "close",
        // which is what made the assistant look like it switched itself off.
        clickMascot()

        expect(isOpen()).toBe(true)
    })

    it("closes on the SECOND, deliberate click", () => {
        render(<MascotAssistant />)

        mouseEnter()
        clickMascot()
        expect(isOpen()).toBe(true)

        clickMascot()

        expect(isOpen()).toBe(false)
    })
})

describe("MascotAssistant — closing after the mouse leaves", () => {
    it("keeps a hover-opened panel through the grace period, then closes it", () => {
        render(<MascotAssistant />)

        mouseEnter()
        mouseLeave()

        // Still there: the gap between mascot and panel is not hoverable, so an
        // immediate close would make the panel impossible to walk into.
        tick(1_500)
        expect(isOpen()).toBe(true)

        tick(1_000)
        expect(isOpen()).toBe(false)
    })

    it("cancels the pending close when the pointer comes back in time", () => {
        render(<MascotAssistant />)

        mouseEnter()
        mouseLeave()
        tick(1_500)
        mouseEnter()

        // Well past the original deadline — the armed close must have been dropped.
        tick(5_000)
        expect(isOpen()).toBe(true)
    })

    it("leaves a CLICK-opened panel alone — the mouse wandering off must not shut it", () => {
        render(<MascotAssistant />)

        clickMascot()
        expect(isOpen()).toBe(true)

        mouseLeave()
        tick(10_000)

        expect(isOpen()).toBe(true)
    })

    it("re-arms correctly for a panel hovered open again after a click closed it", () => {
        render(<MascotAssistant />)

        // hover-open → adopt by click → close by click
        mouseEnter()
        clickMascot()
        clickMascot()
        expect(isOpen()).toBe(false)

        // A fresh hover must be hover-OWNED again (not still marked "click", which
        // would leave it stuck open forever once the mouse left).
        mouseLeave()
        mouseEnter()
        expect(isOpen()).toBe(true)

        mouseLeave()
        tick(2_500)
        expect(isOpen()).toBe(false)
    })
})

describe("MascotAssistant — Escape still closes", () => {
    it("closes a hover-opened panel on Escape", () => {
        render(<MascotAssistant />)

        mouseEnter()
        expect(isOpen()).toBe(true)

        gesture(() => fireEvent.keyDown(document, { key: "Escape" }))

        expect(isOpen()).toBe(false)
    })
})
