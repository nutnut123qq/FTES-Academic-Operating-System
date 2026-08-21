import React from "react"
import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

/**
 * Regression — the landing forwards NOBODY.

 * Góp ý #23 once asked for signed-in visitors to skip the sales page, and the patch for
 * it lived INSIDE this component, which cannot see the url it renders at: it fired on
 * both routes that render the landing and the signed-in half of the audience lost every
 * way into the home page, the navbar logo included ("vô home là nhảy dashboard"). The
 * product owner removed the redirect outright on 2026-08-21 rather than split it per
 * route. This file is the guard: put any session-driven navigation back in here and the
 * signed-in case goes red.
 *
 * The `@/redux/hooks` mock below is kept ON PURPOSE even though `./index` no longer
 * imports it: it is what puts a SIGNED-IN session in front of the component, so a
 * resurrected redirect fails on the assertion rather than on a missing <Provider>.
 * Do not clean it away as a "unused mock".
 *
 * Each case asserts BOTH that no navigation fired AND that the landing actually rendered
 * — a `return null` with no navigation would satisfy the first assertion alone while
 * still showing the visitor a blank page.
 */

const replace = vi.fn()
const push = vi.fn()

const session = vi.hoisted(() => ({ initialized: false, authenticated: false }))

vi.mock("next-intl", () => ({
    useTranslations: () => (key: string) => key,
}))

vi.mock("@/i18n/navigation", () => ({
    useRouter: () => ({ push, replace }),
}))

vi.mock("@/redux/hooks", () => ({
    useAppSelector: (
        selector: (state: { keycloak: { initialized: boolean; authenticated: boolean } }) => unknown,
    ) => selector({ keycloak: session }),
}))

vi.mock("@phosphor-icons/react", () => ({
    ArrowRightIcon: () => <span />,
}))

vi.mock("@heroui/react", () => ({
    Button: ({ children }: { children?: React.ReactNode }) => <button type="button">{children}</button>,
    Typography: ({ children }: { children?: React.ReactNode }) => <span>{children}</span>,
}))

// Sections are not under test — the redirect gate is. Only the hero carries a marker,
// enough to prove the landing tree rendered rather than being short-circuited away.
vi.mock("./sections/JourneyHero", () => ({
    JourneyHero: () => <div data-testid="journey-hero" />,
}))
vi.mock("./sections/HomeMascotGreeting", () => ({ HomeMascotGreetingBand: () => <div /> }))
vi.mock("./sections/PlatformStatsSection", () => ({ PlatformStatsSection: () => <div /> }))
vi.mock("./sections/AchievementsSection", () => ({ AchievementsSection: () => <div /> }))
vi.mock("./sections/OffersPolicySection", () => ({ OffersPolicySection: () => <div /> }))
vi.mock("./sections/HonorBoardSection", () => ({ HonorBoardSection: () => <div /> }))
vi.mock("./sections/MentorTeamSection", () => ({ MentorTeamSection: () => <div /> }))
vi.mock("./sections/FaqSection", () => ({ FaqSection: () => <div /> }))

import { HomeLanding } from "./index"

describe("HomeLanding never redirects", () => {
    beforeEach(() => {
        replace.mockClear()
        push.mockClear()
        session.initialized = false
        session.authenticated = false
    })

    it("keeps a signed-in visitor on the landing", () => {
        session.initialized = true
        session.authenticated = true

        render(<HomeLanding />)

        expect(replace).not.toHaveBeenCalled()
        expect(push).not.toHaveBeenCalled()
        expect(screen.getByTestId("journey-hero")).toBeTruthy()
    })

    it("keeps a guest on the landing", () => {
        session.initialized = true
        session.authenticated = false

        render(<HomeLanding />)

        expect(replace).not.toHaveBeenCalled()
        expect(push).not.toHaveBeenCalled()
        expect(screen.getByTestId("journey-hero")).toBeTruthy()
    })

    it("keeps a visitor whose session has not settled on the landing", () => {
        render(<HomeLanding />)

        expect(replace).not.toHaveBeenCalled()
        expect(push).not.toHaveBeenCalled()
        expect(screen.getByTestId("journey-hero")).toBeTruthy()
    })
})
