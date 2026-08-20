import React from "react"
import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

/**
 * Regression — WHICH ROUTE gets the "signed in → dashboard" redirect.
 *
 * Góp ý #23 asked for signed-in visitors to land in their workspace instead of on the
 * sales page. The first patch implemented it INSIDE this component, which cannot see the
 * url it is rendered at — so it fired on both routes that render the landing, and the
 * signed-in half of the audience lost every way into the home page, the navbar logo
 * included ("vô home là nhảy dashboard"). The gate now belongs to the route, passed in as
 * `redirectSignedIn`; the locale root passes it, `/[locale]/home` does not.
 *
 * The no-prop case asserts BOTH that `replace` stayed unused AND that the landing
 * actually rendered — a `return null` with no navigation would satisfy the first
 * assertion alone while still showing the visitor a blank page.
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

describe("HomeLanding signed-in redirect", () => {
    beforeEach(() => {
        replace.mockClear()
        push.mockClear()
        session.initialized = false
        session.authenticated = false
    })

    it("keeps a signed-in visitor on the landing when the route does not ask for the redirect", () => {
        session.initialized = true
        session.authenticated = true

        render(<HomeLanding />)

        expect(replace).not.toHaveBeenCalled()
        expect(screen.getByTestId("journey-hero")).toBeTruthy()
    })

    it("forwards a signed-in visitor when the route asks for the redirect", () => {
        session.initialized = true
        session.authenticated = true

        render(<HomeLanding redirectSignedIn />)

        // Locale-less on purpose: the i18n router adds the active locale itself.
        expect(replace.mock.calls).toEqual([["/dashboard"]])
    })

    it("leaves a guest on the landing even on the route that asks for the redirect", () => {
        session.initialized = true
        session.authenticated = false

        render(<HomeLanding redirectSignedIn />)

        expect(replace).not.toHaveBeenCalled()
        expect(screen.getByTestId("journey-hero")).toBeTruthy()
    })
})
