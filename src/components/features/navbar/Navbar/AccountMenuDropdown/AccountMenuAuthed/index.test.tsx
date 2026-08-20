import React from "react"
import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

/**
 * Regression — every row of the account menu must route through the LOCALE-AWARE router.
 *
 * The menu builds its targets with `pathConfig().locale()` (no argument), i.e. locale-LESS
 * paths like `/dashboard`. Those are only correct when the router comes from
 * `@/i18n/navigation`, which adds the active locale itself. Paired with `next/navigation`
 * — which adds nothing — the same call pushes `/dashboard` and drops the visitor onto a
 * route that has no locale segment. That is exactly what this file did until 2026-08-20.
 *
 * WHY THE ASSERTIONS LOOK LIKE THIS: the docblock on `src/i18n/navigation.ts` warns that a
 * test which mocks that module can never observe the locale prefix (the mock does not add
 * one), so asserting on a final URL string proves nothing in either direction. Instead both
 * routers are mocked side by side and the test asserts WHICH ONE received the push — the
 * import source — plus the locale-less shape of the path handed to it. A regression in
 * either direction (wrong router, or a locale baked into the path) turns this red.
 *
 * Everything except `@/resources/path` is stubbed: the real `pathConfig` is used on purpose
 * so the asserted strings are the ones the component genuinely produces.
 */

const i18nPush = vi.fn()
const i18nReplace = vi.fn()
const legacyPush = vi.fn()
const legacyReplace = vi.fn()
const close = vi.fn()
const signOutTrigger = vi.fn(async () => undefined)

vi.mock("next-intl", () => ({
    useTranslations: () => (key: string) => key,
}))

vi.mock("@/i18n/navigation", () => ({
    useRouter: () => ({ push: i18nPush, replace: i18nReplace }),
}))

vi.mock("next/navigation", () => ({
    useRouter: () => ({ push: legacyPush, replace: legacyReplace }),
}))

vi.mock("@phosphor-icons/react", () => {
    const Icon = () => <span />
    return {
        SquaresFourIcon: Icon,
        GraduationCapIcon: Icon,
        ChalkboardTeacherIcon: Icon,
        UserIcon: Icon,
        GearIcon: Icon,
        SignOutIcon: Icon,
        WalletIcon: Icon,
        PlusCircleIcon: Icon,
    }
})

vi.mock("@heroui/react", () => {
    const Passthrough = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>
    const Dropdown = Object.assign(Passthrough, {
        Menu: Passthrough,
        Section: Passthrough,
        Item: ({
            children,
            id,
            onPress,
        }: {
            children?: React.ReactNode
            id?: string
            onPress?: () => void
        }) => (
            <button type="button" data-testid={`item-${id}`} onClick={onPress}>
                {children}
            </button>
        ),
    })
    return {
        Dropdown,
        Label: ({ children }: { children?: React.ReactNode }) => <span>{children}</span>,
    }
})

vi.mock("@/hooks/useHasPermission", () => ({ useHasPermission: () => true }))
vi.mock("@/hooks/zustand/overlay/hooks", () => ({
    useAccountMenuOverlayState: () => ({ close }),
}))
vi.mock("@/hooks/swr/api/rest/queries/useGetMyWalletSwr", () => ({
    useGetMyWalletSwr: () => ({ data: undefined }),
}))
vi.mock("@/hooks/swr/api/graphql/mutations/useMutateSignOutSwr", () => ({
    useMutateSignOutSwr: () => ({ trigger: signOutTrigger }),
}))

import { AccountMenuAuthed } from "./index"

/**
 * Every menu row, with the locale-LESS path it must hand to the i18n router.
 *
 * This list doubles as the menu's inventory, so it is also what pins "Khóa học của tôi"
 * (`my-courses` → `/courses/me`) as PRESENT. That row was removed on 2026-08-15 and
 * restored on 2026-08-21 by the owner's call; the entry below was added back with it, so
 * a second silent removal turns this red instead of shipping.
 */
const ROWS: ReadonlyArray<[string, string]> = [
    ["dashboard", "/dashboard"],
    ["my-courses", "/courses/me"],
    ["teaching", "/courses/teaching"],
    ["profile", "/profile"],
    ["settings", "/profile/settings"],
    ["wallet", "/wallet"],
]

describe("AccountMenuAuthed navigation", () => {
    it.each(ROWS)("routes %s through the locale-aware router", (id, path) => {
        i18nPush.mockClear()
        legacyPush.mockClear()

        render(<AccountMenuAuthed />)
        fireEvent.click(screen.getByTestId(`item-${id}`))

        expect(i18nPush.mock.calls).toEqual([[path]])
        expect(legacyPush).not.toHaveBeenCalled()
    })

    // Explicit, so the row's presence does not rest on someone reading a table: the
    // translator is mocked to echo the key, hence the assertion on `nav.myCourses`.
    it("renders the 'Khóa học của tôi' row, labelled from nav.myCourses", () => {
        render(<AccountMenuAuthed />)

        const row = screen.getByTestId("item-my-courses")
        expect(row).toBeTruthy()
        expect(row.textContent).toContain("nav.myCourses")
    })

    it("sends the post-sign-out redirect through the same router, locale-less", async () => {
        i18nReplace.mockClear()
        legacyReplace.mockClear()

        render(<AccountMenuAuthed />)
        fireEvent.click(screen.getByTestId("item-logout"))
        await vi.waitFor(() => expect(i18nReplace).toHaveBeenCalled())

        // `/home`, not `/vi/home`: the i18n router prefixes it. A locale baked in here
        // would produce `/vi/vi/home`, a real 404.
        expect(i18nReplace.mock.calls).toEqual([["/home"]])
        expect(legacyReplace).not.toHaveBeenCalled()
    })
})
