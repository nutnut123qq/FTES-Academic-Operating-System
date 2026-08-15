/**
 * Regression: one account must never read another account's WALLET BALANCE.
 *
 * `["wallet","me"]` / `["GET_MY_WALLET_SWR"]` — keys gated only on "is somebody signed
 * in" — are the SAME cache entry for every user. Sign out of A and into B in the SAME
 * TAB and B's hook re-keys to that identical string, so SWR hands B the settled entry it
 * still holds for A: stale-while-revalidate paints A's coin balance and ledger instantly,
 * and inside `dedupingInterval` the revalidation may not even run. Both keys now carry
 * the viewer id (`state.user.user.id`), so A's entry is unreachable from B's key.
 *
 * The tests sign out WITHOUT flushing the SWR cache on purpose: the sign-out button does
 * flush, but a revoked / expired session does not, and the key alone must make the leak
 * impossible. Drop the `viewerId` segment from either key and the matching test goes red
 * on the balance assertion right after B signs in.
 *
 * The last test guards the OTHER half of the change: PaymentModal refreshes the balance
 * after a top-up through the hook's BOUND `mutate()`. If a call site ever rebuilds the
 * key array by hand and the shape drifts, the revalidation silently misses and the buyer
 * keeps staring at the pre-purchase balance — a failure nobody sees.
 */
import React from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { act, renderHook, waitFor } from "@testing-library/react"
import { Provider } from "react-redux"
import { SWRConfig } from "swr"

const walletMock = vi.fn()
const transactionsMock = vi.fn()

vi.mock("@/modules/api/rest/wallet", () => ({
    getMyWallet: () => walletMock(),
    getMyTransactions: () => transactionsMock(),
}))

import { store } from "@/redux/store"
import { setAuthenticated } from "@/redux/slices/keycloak"
import { setUser } from "@/redux/slices/user"
import { useQueryWalletSwr } from "./useQueryWalletSwr"
import { useGetMyWalletSwr } from "@/hooks/swr/api/rest/queries/useGetMyWalletSwr"
import type { UserEntity } from "@/modules/types/entities/user"

/** Redux store (session + viewer) + an SWR cache private to this file. */
const wrapper = ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>
        <SWRConfig value={{
            provider: () => new Map(),
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
        }}>
            {children}
        </SWRConfig>
    </Provider>
)

/** A `WalletView` with the given balance. */
const walletView = (balance: number) => ({ balance, status: "ACTIVE" })

/** One ledger row, so a leak shows up in the transaction list too. */
const ledgerPage = (memo: string) => ({
    items: [{
        id: `tx-${memo}`,
        type: "RECEIVE",
        status: "COMPLETED",
        direction: "IN",
        amount: 10,
        memo,
        createdAt: "2026-08-15T00:00:00Z",
    }],
})

/**
 * `useGetMyWalletSwr` returns SWR's own response object, whose fields are
 * dependency-TRACKED: SWR re-renders only for fields the caller read DURING RENDER.
 * Real consumers (`walletSwr.data?.balance` in PaymentModal / QuestBoard) read it in
 * their render, so this probe does the same — reading `.data` only from the test body
 * would leave the balance frozen at `undefined` forever, a test artefact and not a bug.
 */
const useWalletBalanceProbe = () => {
    const swr = useGetMyWalletSwr()
    return { balance: swr.data?.balance, mutate: swr.mutate }
}

/** Sign a viewer in the way every real sign-in path does (flag + hydrated viewer). */
const signIn = async (id: string) => {
    await act(async () => {
        window.localStorage.setItem("keycloak:access_token", `tok-${id}`)
        store.dispatch(setAuthenticated(true))
        store.dispatch(setUser({ id } as UserEntity))
    })
}

/** Sign out the redux way only — no SWR cache flush (mirrors a revoked session). */
const signOut = async () => {
    await act(async () => {
        window.localStorage.clear()
        store.dispatch(setAuthenticated(false))
        store.dispatch(setUser(null))
    })
}

describe("wallet hooks — cache is scoped to the viewer", () => {
    beforeEach(() => {
        walletMock.mockReset()
        transactionsMock.mockReset()
        window.localStorage.clear()
        store.dispatch(setAuthenticated(false))
        store.dispatch(setUser(null))
    })

    it("useQueryWalletSwr does not serve user A's balance to user B in the same tab", async () => {
        walletMock.mockResolvedValue(walletView(100))
        transactionsMock.mockResolvedValue(ledgerPage("A-only"))
        const { result } = renderHook(() => useQueryWalletSwr(), { wrapper })

        // A signs in and their balance lands in the cache.
        await signIn("user-a")
        await waitFor(() => expect(result.current.balance).toBe(100))
        expect(result.current.transactions[0]?.description).toBe("A-only")

        await signOut()

        // B's request is left hanging, so anything rendered for B can only have come
        // from the cache — which is exactly the leak under test.
        let releaseB: (wallet: unknown) => void = () => undefined
        walletMock.mockImplementation(
            () => new Promise((resolve) => {
                releaseB = resolve
            }),
        )
        transactionsMock.mockResolvedValue(ledgerPage("B-only"))
        await signIn("user-b")

        expect(result.current.balance).toBe(0)
        expect(result.current.transactions).toEqual([])

        // B's own answer, once it arrives, is what B sees.
        await act(async () => {
            releaseB(walletView(7))
        })
        await waitFor(() => expect(result.current.balance).toBe(7))
        expect(result.current.transactions[0]?.description).toBe("B-only")
    })

    it("useGetMyWalletSwr does not serve user A's balance to user B in the same tab", async () => {
        walletMock.mockResolvedValue(walletView(100))
        const { result } = renderHook(() => useWalletBalanceProbe(), { wrapper })

        await signIn("user-a")
        await waitFor(() => expect(result.current.balance).toBe(100))

        await signOut()

        let releaseB: (wallet: unknown) => void = () => undefined
        walletMock.mockImplementation(
            () => new Promise((resolve) => {
                releaseB = resolve
            }),
        )
        await signIn("user-b")

        expect(result.current.balance).toBeUndefined()

        await act(async () => {
            releaseB(walletView(7))
        })
        await waitFor(() => expect(result.current.balance).toBe(7))
    })

    it("does not call the wallet endpoint while signed out", async () => {
        walletMock.mockResolvedValue(walletView(100))
        transactionsMock.mockResolvedValue(ledgerPage("guest"))

        const { result } = renderHook(() => useQueryWalletSwr(), { wrapper })

        await act(async () => { await Promise.resolve() })
        expect(walletMock).not.toHaveBeenCalled()
        expect(transactionsMock).not.toHaveBeenCalled()
        expect(result.current.balance).toBe(0)
        expect(result.current.isLoading).toBe(false)
    })

    it("the bound mutate still matches the viewer-scoped key after a top-up", async () => {
        walletMock.mockResolvedValue(walletView(100))
        const { result } = renderHook(() => useWalletBalanceProbe(), { wrapper })

        await signIn("user-a")
        await waitFor(() => expect(result.current.balance).toBe(100))

        // The buyer tops up; PaymentModal calls exactly this bound mutate on success.
        walletMock.mockResolvedValue(walletView(350))
        await act(async () => {
            await result.current.mutate()
        })

        await waitFor(() => expect(result.current.balance).toBe(350))
    })
})
