import React from "react"
import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

/**
 * Regression — the navbar logo must land somewhere the visitor can actually stay.
 *
 * It used to push `/home` unconditionally. That was correct until the landing started
 * bouncing signed-in visitors, at which point the single most common "take me home"
 * gesture threw them straight back out to the dashboard. The target now follows the
 * session: signed in → `/dashboard`, guest (or a session that has not settled yet) →
 * `/home`, which after `home-landing-redirect-scope` bounces nobody.
 *
 * The mocked `@/i18n/navigation` router PREFIXES the locale the way the real one does,
 * so the assertions can name full paths: a locale accidentally baked into `pathConfig()`
 * would surface here as `/vi/vi/home` rather than passing unnoticed. The real
 * `@/resources/path` is used on purpose so the asserted strings are the ones the
 * component genuinely produces.
 */

const push = vi.fn()

vi.mock("@/i18n/navigation", () => ({
    useRouter: () => ({ push: (path: string) => push(`/vi${path}`) }),
}))

const session = vi.hoisted(() => ({ initialized: false, authenticated: false }))

vi.mock("@/redux/hooks", () => ({
    useAppSelector: (
        selector: (state: { keycloak: { initialized: boolean; authenticated: boolean } }) => unknown,
    ) => selector({ keycloak: session }),
}))

vi.mock("@heroui/react", () => ({
    cn: (...parts: Array<string | undefined>) => parts.filter(Boolean).join(" "),
    Link: ({ children, onPress }: { children?: React.ReactNode; onPress?: () => void }) => (
        <button type="button" data-testid="logo" onClick={onPress}>
            {children}
        </button>
    ),
}))

vi.mock("@/components/blocks/identity/BrandLogo", () => ({ BrandLogo: () => <span /> }))

import { Logo } from "./index"

describe("Logo destination", () => {
    beforeEach(() => {
        push.mockClear()
        session.initialized = false
        session.authenticated = false
    })

    it("sends a signed-in visitor to the dashboard", () => {
        session.initialized = true
        session.authenticated = true

        render(<Logo />)
        fireEvent.click(screen.getByTestId("logo"))

        expect(push.mock.calls).toEqual([["/vi/dashboard"]])
    })

    it("sends a guest to the landing", () => {
        session.initialized = true
        session.authenticated = false

        render(<Logo />)
        fireEvent.click(screen.getByTestId("logo"))

        expect(push.mock.calls).toEqual([["/vi/home"]])
    })

    it("leans towards the landing while the session has not settled", () => {
        session.initialized = false
        session.authenticated = false

        render(<Logo />)
        fireEvent.click(screen.getByTestId("logo"))

        expect(push.mock.calls).toEqual([["/vi/home"]])
    })
})
