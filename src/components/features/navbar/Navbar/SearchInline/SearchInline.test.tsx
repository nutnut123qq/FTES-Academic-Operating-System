import React from "react"
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

/**
 * Unit — {@link SearchInline}, the desktop inline navbar search field + results
 * dropdown (change `blog-nav-and-engagement`, task 4.5). Asserts the dropdown opens
 * ONLY when the field is focused AND the trimmed query meets the minimum length; that
 * a guest sees a sign-in prompt (the fetch gate lives in `useGlobalSearch`, mocked
 * here to report `authenticated: false`); that ArrowDown wraps the active option and
 * Enter navigates to the active row's route; and that Esc closes the dropdown WITHOUT
 * clearing the query.
 *
 * Collaborators are mocked so the component renders in happy-dom without Redux, the
 * router, the HeroUI theme, or a real fetch: `useAppSelector` is driven per-test,
 * `useGlobalSearch` returns a fixed result set, and `SearchDropdown` is a thin double
 * exposing its props. The REAL `SearchOverlayInput` is used so focus/keydown run
 * against an actual `<input>`.
 */

const h = vi.hoisted(() => ({
    query: "",
    authenticated: true,
    push: vi.fn<(href: string) => void>(),
    addRecent: vi.fn<(q: string) => void>(),
    openAuth: vi.fn<(key?: string) => void>(),
    search: {
        query: "",
        authenticated: true,
        groups: [] as Array<unknown>,
        flatRows: [] as Array<{ id: string; href: string | null }>,
        isLoading: false,
        hasResults: false,
        error: undefined as unknown,
        retry: vi.fn(),
    },
    lastEnabled: undefined as boolean | undefined,
}))

vi.mock("next-intl", () => ({
    useTranslations: () => (key: string) => key,
    useLocale: () => "vi",
}))

vi.mock("next/navigation", () => ({
    useRouter: () => ({ push: h.push }),
}))

vi.mock("@/redux/hooks", () => ({
    useAppDispatch: () => vi.fn(),
    useAppSelector: (selector: (state: unknown) => unknown) =>
        selector({ search: { query: h.query }, keycloak: { authenticated: h.authenticated } }),
}))

vi.mock("@/redux/slices/search", () => ({
    setSearchQuery: (q: string) => ({ type: "search/set", payload: q }),
}))

vi.mock("@/hooks/zustand/overlay/hooks", () => ({
    useAuthenticationOverlayState: () => ({ open: h.openAuth }),
}))

vi.mock("@/hooks/reuseables/useRecentSearches", () => ({
    useRecentSearches: () => ({ recent: [], add: h.addRecent, clear: vi.fn() }),
}))

vi.mock("@/components/features/search/hooks/useGlobalSearch", () => ({
    SEARCH_MIN_CHARS: 2,
    useGlobalSearch: (enabled: boolean) => {
        h.lastEnabled = enabled
        return { ...h.search }
    },
}))

// Thin double so the dropdown's own subtree (results/highlight/heroui) stays out of
// scope; it surfaces the props the container feeds it and lets us drive its actions.
vi.mock("./SearchDropdown", () => ({
    SearchDropdown: ({
        authenticated,
        onActivate,
        onSeeAll,
        onSignIn,
        groups,
    }: {
        authenticated: boolean
        onActivate: (row: { id: string; href: string | null }) => void
        onSeeAll: () => void
        onSignIn: () => void
        groups: Array<{ rows: Array<{ id: string; href: string | null }> }>
    }) => (
        <div data-testid="dropdown">
            {authenticated ? (
                <>
                    {groups.flatMap((g) => g.rows).map((row) => (
                        <button key={row.id} type="button" onClick={() => onActivate(row)}>
                            {`row-${row.id}`}
                        </button>
                    ))}
                    <button type="button" onClick={onSeeAll}>
                        see-all
                    </button>
                </>
            ) : (
                <button type="button" onClick={onSignIn}>
                    signInPrompt
                </button>
            )}
        </div>
    ),
}))

vi.mock("@phosphor-icons/react", () => ({
    MagnifyingGlassIcon: (props: Record<string, unknown>) => <svg data-testid="mag" {...props} />,
    XIcon: (props: Record<string, unknown>) => <svg data-testid="x" {...props} />,
}))

vi.mock("@heroui/react", () => {
    const Spinner = (props: Record<string, unknown>) => <span data-testid="spinner" {...props} />
    const Kbd = ({ children }: { children?: React.ReactNode }) => <kbd>{children}</kbd>
    Object.assign(Kbd, { Content: ({ children }: { children?: React.ReactNode }) => <span>{children}</span> })
    const cn = (...args: Array<unknown>) => args.filter(Boolean).join(" ")
    return { Spinner, Kbd, cn }
})

import { SearchInline } from "./index"

const input = () => screen.getByRole("combobox") as HTMLInputElement

beforeEach(() => {
    h.query = ""
    h.authenticated = true
    h.push.mockReset()
    h.addRecent.mockReset()
    h.openAuth.mockReset()
    h.search = {
        query: "",
        authenticated: true,
        groups: [],
        flatRows: [],
        isLoading: false,
        hasResults: false,
        error: undefined,
        retry: vi.fn(),
    }
    h.lastEnabled = undefined
})

afterEach(() => cleanup())

describe("SearchInline — dropdown open gating", () => {
    it("stays closed while the field is unfocused even with a valid query", () => {
        h.query = "docker"
        render(<SearchInline />)
        expect(screen.queryByTestId("dropdown")).toBeNull()
        expect(h.lastEnabled).toBe(false)
    })

    it("stays closed on focus when the query is below the minimum length", () => {
        h.query = "d"
        render(<SearchInline />)
        fireEvent.focus(input())
        expect(screen.queryByTestId("dropdown")).toBeNull()
    })

    it("opens on focus once the query meets the minimum length", () => {
        h.query = "do"
        render(<SearchInline />)
        fireEvent.focus(input())
        expect(screen.getByTestId("dropdown")).toBeTruthy()
        expect(h.lastEnabled).toBe(true)
    })
})

describe("SearchInline — guest", () => {
    it("shows a sign-in prompt (no results) and opens the auth flow on demand", () => {
        h.authenticated = false
        h.search.authenticated = false
        h.query = "react"
        render(<SearchInline />)
        fireEvent.focus(input())

        const prompt = screen.getByText("signInPrompt")
        expect(prompt).toBeTruthy()
        fireEvent.click(prompt)
        expect(h.openAuth).toHaveBeenCalledWith("auth.context.search")
        // no entity rows offered to a guest
        expect(screen.queryByText(/^row-/)).toBeNull()
    })
})

describe("SearchInline — keyboard", () => {
    beforeEach(() => {
        h.query = "react"
        h.search.query = "react"
        h.search.hasResults = true
        h.search.groups = [{ kind: "courses", rows: [{ id: "a", href: "/a" }, { id: "b", href: "/b" }] }]
        h.search.flatRows = [
            { id: "a", href: "/a" },
            { id: "b", href: "/b" },
        ]
    })

    it("ArrowDown twice then Enter activates the SECOND row and records the query", () => {
        render(<SearchInline />)
        const el = input()
        fireEvent.focus(el)
        fireEvent.keyDown(el, { key: "ArrowDown" })
        fireEvent.keyDown(el, { key: "ArrowDown" })
        fireEvent.keyDown(el, { key: "Enter" })
        expect(h.push).toHaveBeenCalledWith("/b")
        expect(h.addRecent).toHaveBeenCalledWith("react")
    })

    it("wraps the active option from the last row back to the first", () => {
        render(<SearchInline />)
        const el = input()
        fireEvent.focus(el)
        // -1 → 0 → 1 → wrap → 0
        fireEvent.keyDown(el, { key: "ArrowDown" })
        fireEvent.keyDown(el, { key: "ArrowDown" })
        fireEvent.keyDown(el, { key: "ArrowDown" })
        fireEvent.keyDown(el, { key: "Enter" })
        expect(h.push).toHaveBeenCalledWith("/a")
    })

    it("Enter with no active option hands off to /search?q= (see-all)", () => {
        render(<SearchInline />)
        const el = input()
        fireEvent.focus(el)
        fireEvent.keyDown(el, { key: "Enter" })
        expect(h.push).toHaveBeenCalledWith("/vi/search?q=react")
    })

    it("Esc closes the dropdown but keeps the field focused and its query", () => {
        render(<SearchInline />)
        const el = input()
        fireEvent.focus(el)
        expect(screen.getByTestId("dropdown")).toBeTruthy()

        fireEvent.keyDown(el, { key: "Escape" })
        expect(screen.queryByTestId("dropdown")).toBeNull()
        // query is untouched (still reflected in the controlled input) and nothing navigated
        expect(el.value).toBe("react")
        expect(h.push).not.toHaveBeenCalled()
    })
})
