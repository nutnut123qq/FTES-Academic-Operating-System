import React from "react"
import { fireEvent, render } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { MascotCoachMark } from "./MascotCoachMark"
import { welcomeTour, WELCOME_TOUR_ID } from "./welcome-tour"
import { INTENT_POSE, type StepIntent } from "./types"
import { isTourDone, markTourDone, TOUR_DONE_KEY } from "./persistence"

/**
 * Unit tests for the onboarding tour engine (`onboarding-mascot-guide`). Only the
 * two UI libraries the coach-mark touches are mocked — `next-intl` (echoes the
 * key, appends params so ICU wiring is visible) and `@heroui/react` (`cn` join +
 * a plain `<button>` for `Button`). This pins the engine's own contract: the tour
 * data shape, the localStorage done-flag, the intent→pose map, and the coach
 * card's progress + Back/Skip/Next controls.
 */
vi.mock("next-intl", () => ({
    useTranslations: () => (key: string, params?: Record<string, unknown>) =>
        params ? `${key}:${JSON.stringify(params)}` : key,
}))

vi.mock("@heroui/react", () => ({
    cn: (...a: Array<unknown>) => a.filter(Boolean).join(" "),
    // drop styling-only props so they don't leak onto the DOM node
    Button: ({
        children,
        onPress,
    }: {
        children: React.ReactNode
        onPress?: () => void
    }) => (
        <button type="button" onClick={onPress}>
            {children}
        </button>
    ),
}))

describe("welcome tour data", () => {
    it("is a first-login walk-through with an opening + a celebration bookend", () => {
        expect(welcomeTour.id).toBe(WELCOME_TOUR_ID)
        expect(welcomeTour.steps.length).toBeGreaterThanOrEqual(6)
        const first = welcomeTour.steps[0]
        const last = welcomeTour.steps[welcomeTour.steps.length - 1]
        // opening + closing steps are centered (no target) with the right intents
        expect(first.intent).toBe("welcome")
        expect(first.target).toBeUndefined()
        expect(last.intent).toBe("celebrate")
        expect(last.target).toBeUndefined()
    })

    it("anchors the four header modules + search + account via stable data-tour ids", () => {
        const targets = welcomeTour.steps.map((s) => s.target).filter(Boolean)
        expect(targets).toEqual([
            "nav-home",
            "nav-workplace",
            "nav-course",
            "nav-community",
            "global-search",
            "account-menu",
        ])
    })

    it("references an i18n key for every piece of copy (no inline text)", () => {
        for (const step of welcomeTour.steps) {
            expect(step.titleKey).toMatch(/^onboarding\./)
            expect(step.bodyKey).toMatch(/^onboarding\./)
        }
    })

    it("maps each intent to a distinct mascot pose", () => {
        const intents: StepIntent[] = ["welcome", "explain", "point", "celebrate"]
        const poses = intents.map((i) => INTENT_POSE[i])
        expect(new Set(poses).size).toBe(intents.length)
    })
})

describe("tour persistence", () => {
    beforeEach(() => {
        window.localStorage.clear()
    })
    afterEach(() => {
        window.localStorage.clear()
    })

    it("defaults to not-done and round-trips the done flag", () => {
        expect(isTourDone()).toBe(false)
        markTourDone()
        expect(window.localStorage.getItem(TOUR_DONE_KEY)).toBe("1")
        expect(isTourDone()).toBe(true)
    })
})

describe("MascotCoachMark", () => {
    const baseProps = {
        step: welcomeTour.steps[1], // a targeted step
        total: welcomeTour.steps.length,
        onPrev: vi.fn(),
        onNext: vi.fn(),
        onSkip: vi.fn(),
        confirmingSkip: false,
        onConfirmSkip: vi.fn(),
        onCancelSkip: vi.fn(),
        animated: true,
    }

    it("shows Skip + Next but no Back on the first step, and wires Next", () => {
        const onNext = vi.fn()
        const { getByText, queryByText } = render(
            <MascotCoachMark {...baseProps} index={0} onNext={onNext} />,
        )
        expect(getByText("onboarding.skip")).toBeTruthy()
        expect(queryByText("common.back")).toBeNull()
        fireEvent.click(getByText("onboarding.next"))
        expect(onNext).toHaveBeenCalledTimes(1)
    })

    it("shows Back + Finish but no Skip on the last step", () => {
        const last = welcomeTour.steps.length - 1
        const onPrev = vi.fn()
        const { getByText, queryByText } = render(
            <MascotCoachMark
                {...baseProps}
                step={welcomeTour.steps[last]}
                index={last}
                onPrev={onPrev}
            />,
        )
        expect(queryByText("onboarding.skip")).toBeNull()
        expect(getByText("onboarding.finish")).toBeTruthy()
        fireEvent.click(getByText("common.back"))
        expect(onPrev).toHaveBeenCalledTimes(1)
    })

    it("renders the n / N progress with the step position", () => {
        const { getByText } = render(<MascotCoachMark {...baseProps} index={2} />)
        // progress key called with current=3 (index+1) and the total
        expect(
            getByText(`onboarding.progress:{"current":3,"total":${baseProps.total}}`),
        ).toBeTruthy()
    })

    it("swaps in the skip-confirm prompt and wires confirm + cancel", () => {
        const onConfirmSkip = vi.fn()
        const onCancelSkip = vi.fn()
        const { getByText, queryByText } = render(
            <MascotCoachMark
                {...baseProps}
                index={1}
                confirmingSkip
                onConfirmSkip={onConfirmSkip}
                onCancelSkip={onCancelSkip}
            />,
        )
        // step nav is replaced by the confirm prompt (no progress / Next)
        expect(getByText("onboarding.skipConfirm.title")).toBeTruthy()
        expect(queryByText("onboarding.next")).toBeNull()
        fireEvent.click(getByText("onboarding.skipConfirm.cancel"))
        expect(onCancelSkip).toHaveBeenCalledTimes(1)
        fireEvent.click(getByText("onboarding.skipConfirm.confirm"))
        expect(onConfirmSkip).toHaveBeenCalledTimes(1)
    })
})
