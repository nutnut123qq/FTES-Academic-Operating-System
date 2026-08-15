/**
 * Regression: signing in must hydrate the viewer — the identity the navbar renders —
 * WITHOUT a page reload, including on the second sign-in of the same tab.
 *
 * The first sign-in always worked (the `me` query's SWR key flips with `authenticated`,
 * and an unseen key always fetches). The second one did not: sign-out leaves the
 * signed-in key settled in the SWR cache, so flipping back to it served the cached entry
 * without running the fetcher — and the fetcher is the ONLY writer of `state.user.user`.
 * The user got a "success" toast over a signed-out avatar until they pressed F5.
 */
import React from "react"
import { describe, expect, it, vi, beforeEach } from "vitest"
import { render, screen, waitFor, act } from "@testing-library/react"
import { Provider } from "react-redux"
import { SWRConfig } from "swr"

const queryMeMock = vi.fn()
const getSelfProfileMock = vi.fn()
const keycloakLoginMock = vi.fn()
const keycloakLogoutMock = vi.fn()

vi.mock("@/modules/api/graphql/queries/query-me", () => ({
    queryMe: (...args: Array<unknown>) => queryMeMock(...args),
    QueryMe: { Query1: "query1" },
}))
vi.mock("@/modules/api/rest/profile", () => ({
    getSelfProfile: () => getSelfProfileMock(),
}))
vi.mock("@/modules/api/rest/keycloak-auth/login", () => ({
    keycloakLogin: (...args: Array<unknown>) => keycloakLoginMock(...args),
}))
vi.mock("@/modules/api/rest/keycloak-auth/logout", () => ({
    keycloakLogout: () => keycloakLogoutMock(),
}))

import { store } from "@/redux/store"
import { useQueryUserSwr } from "@/hooks/swr/api/graphql/queries/useQueryUserSwr"
import { usePostKeycloakLoginSwr } from "./usePostKeycloakLoginSwr"
import { useMutateSignOutSwr } from "@/hooks/swr/api/graphql/mutations/useMutateSignOutSwr"
import { useAppSelector } from "@/redux/hooks"
import { setAuthenticated } from "@/redux/slices/keycloak"
import { setUser } from "@/redux/slices/user"

/** Mirrors what the navbar account menu reads to decide signed-in vs guest. */
const Header = () => {
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const user = useAppSelector((state) => state.user.user)
    useQueryUserSwr()
    return (
        <div data-testid="header">
            {authenticated && user ? `AUTHED:${user.username}` : "GUEST"}
        </div>
    )
}

const Controls = () => {
    const login = usePostKeycloakLoginSwr()
    const signOut = useMutateSignOutSwr()
    return (
        <>
            <button
                type="button"
                onClick={() => {
                    void login.trigger({ identifier: "learner", password: "secret" })
                }}
            >
                login
            </button>
            <button type="button" onClick={() => { void signOut.trigger() }}>
                logout
            </button>
        </>
    )
}

const App = () => (
    <Provider store={store}>
        {/* same revalidation defaults as the app's SwrProvider */}
        <SWRConfig value={{
            provider: () => new Map(),
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
            dedupingInterval: 60_000,
            keepPreviousData: false,
        }}>
            <Header />
            <Controls />
        </SWRConfig>
    </Provider>
)

describe("usePostKeycloakLoginSwr", () => {
    beforeEach(() => {
        localStorage.clear()
        queryMeMock.mockReset()
        getSelfProfileMock.mockReset()
        keycloakLoginMock.mockReset()
        keycloakLogoutMock.mockReset()
        queryMeMock.mockResolvedValue({
            data: {
                me: {
                    user: {
                        id: "u1",
                        username: "learner",
                        displayName: "Learner",
                        avatarUrl: null,
                    },
                    progression: { totalXp: 10 },
                    permissions: [],
                    scopedGrants: [],
                },
            },
        })
        getSelfProfileMock.mockResolvedValue(null)
        keycloakLoginMock.mockResolvedValue({ accessToken: "tok", refreshToken: "ref" })
        keycloakLogoutMock.mockResolvedValue(undefined)
        // the store is a module singleton — start every case signed out
        store.dispatch(setUser(null))
        store.dispatch(setAuthenticated(false))
    })

    it("hydrates the header on sign-in, sign-out and sign-in AGAIN in the same tab", async () => {
        render(<App />)
        expect(screen.getByTestId("header").textContent).toBe("GUEST")

        await act(async () => { screen.getByText("login").click() })
        await waitFor(() => {
            expect(screen.getByTestId("header").textContent).toBe("AUTHED:learner")
        })

        await act(async () => { screen.getByText("logout").click() })
        await waitFor(() => {
            expect(screen.getByTestId("header").textContent).toBe("GUEST")
        })

        // the regression: the second sign-in must refetch `me`, not reuse the settled key
        await act(async () => { screen.getByText("login").click() })
        await waitFor(() => {
            expect(screen.getByTestId("header").textContent).toBe("AUTHED:learner")
        })
    })
})
