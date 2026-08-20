import { describe, expect, it } from "vitest"

import { routing } from "./routing"

/**
 * Regression — the LOCALE cookie must be writable on the hosts this app actually runs on.
 *
 * The config inherited a `domain: ".academy.starci.org"` from the StarCi skeleton plus the
 * `secure: true` + `sameSite: "none"` pair that goes with a cross-site cookie. Both are
 * silent killers: a browser discards a `Set-Cookie` whose `Domain` does not cover the
 * current host, and a `Secure` cookie never lands over plain `http://localhost`. Nothing
 * throws — the locale choice simply never persists, which is why this went unnoticed.
 *
 * Assertions are on the routing object only; no next-intl runtime is exercised.
 */

describe("routing.localeCookie", () => {
    it("pins no cookie domain, so the cookie is host-only everywhere", () => {
        expect(routing.localeCookie).toBeTruthy()
        expect("domain" in (routing.localeCookie as Record<string, unknown>)).toBe(false)
    })

    it("uses first-party sameSite so http://localhost keeps the cookie", () => {
        expect((routing.localeCookie as { sameSite?: string }).sameSite).toBe("lax")
    })

    it("keeps the cookie name and max-age the middleware and server code expect", () => {
        expect((routing.localeCookie as { name?: string }).name).toBe("LOCALE")
        expect((routing.localeCookie as { maxAge?: number }).maxAge).toBe(60 * 60 * 24 * 365)
    })
})
