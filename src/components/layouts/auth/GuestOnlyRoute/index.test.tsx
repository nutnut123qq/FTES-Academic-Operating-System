import React from "react"
import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

const replace = vi.fn()
let authenticated = false

vi.mock("@/i18n/navigation", () => ({
    useRouter: () => ({ replace }),
}))
vi.mock("@/redux/hooks", () => ({
    useAppSelector: (selector: (state: { keycloak: { authenticated: boolean } }) => unknown) =>
        selector({ keycloak: { authenticated } }),
}))

import { GuestOnlyRoute } from "./index"

/**
 * Unit — the guest-only route guard. What matters: a guest keeps the page, a
 * signed-in visitor is sent home AND stops seeing the stale content, and the
 * transition from guest to signed-in mid-session (the reported bug: request a
 * reset link, then sign in with another account in the same tab) is handled.
 */

beforeEach(() => {
    replace.mockReset()
    authenticated = false
})

describe("GuestOnlyRoute", () => {
    it("renders children and stays put for a guest", () => {
        render(<GuestOnlyRoute><p>reset card</p></GuestOnlyRoute>)

        expect(screen.getByText("reset card")).toBeTruthy()
        expect(replace).not.toHaveBeenCalled()
    })

    it("hides children and redirects home when a session is already live", () => {
        authenticated = true
        render(<GuestOnlyRoute><p>reset card</p></GuestOnlyRoute>)

        expect(screen.queryByText("reset card")).toBeNull()
        // locale-less path: `@/i18n/navigation` adds the active locale itself
        expect(replace).toHaveBeenCalledWith("/")
    })

    it("drops the stale card when the user signs in while the page is open", () => {
        const { rerender } = render(<GuestOnlyRoute><p>reset card</p></GuestOnlyRoute>)
        expect(screen.getByText("reset card")).toBeTruthy()

        authenticated = true
        rerender(<GuestOnlyRoute><p>reset card</p></GuestOnlyRoute>)

        expect(screen.queryByText("reset card")).toBeNull()
        expect(replace).toHaveBeenCalledTimes(1)
        expect(replace).toHaveBeenCalledWith("/")
    })
})
