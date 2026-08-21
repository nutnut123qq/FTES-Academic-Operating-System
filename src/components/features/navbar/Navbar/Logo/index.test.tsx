import React from "react"
import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

/**
 * Regression — the navbar logo goes to `/home`, for everyone.
 *
 * It briefly branched on the session (signed in → `/dashboard`) while the landing bounced
 * signed-in visitors and the logo therefore threw them straight back out. The product
 * owner removed that redirect on 2026-08-21, so the branch went with it: one target, no
 * session read.
 *
 * The mocked `@/i18n/navigation` router PREFIXES the locale the way the real one does, so
 * the assertions can name full paths: a locale accidentally baked into `pathConfig()`
 * would surface here as `/vi/vi/home` rather than passing unnoticed. The real
 * `@/resources/path` is used on purpose so the asserted strings are the ones the
 * component genuinely produces.
 */

const push = vi.fn()

// Giữ CỐ Ý dù `./index` không còn import: nó dựng sẵn một phiên ĐÃ ĐĂNG NHẬP, nên ai dựng
// lại nhánh "signed in → /dashboard" sẽ đỏ vì SAI ĐÍCH, chứ không phải vì crash thiếu
// <Provider>. Đừng dọn mock này đi.
const session = vi.hoisted(() => ({ initialized: true, authenticated: true }))

vi.mock("@/redux/hooks", () => ({
    useAppSelector: (
        selector: (state: { keycloak: { initialized: boolean; authenticated: boolean } }) => unknown,
    ) => selector({ keycloak: session }),
}))

vi.mock("@/i18n/navigation", () => ({
    useRouter: () => ({ push: (path: string) => push(`/vi${path}`) }),
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
    })

    it("goes to the landing", () => {
        render(<Logo />)
        fireEvent.click(screen.getByTestId("logo"))

        expect(push.mock.calls).toEqual([["/vi/home"]])
    })

    it("goes to the landing for a signed-in visitor too", () => {
        session.initialized = true
        session.authenticated = true

        render(<Logo />)
        fireEvent.click(screen.getByTestId("logo"))

        expect(push.mock.calls).toEqual([["/vi/home"]])
    })
})
