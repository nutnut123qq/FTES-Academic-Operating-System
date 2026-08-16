/**
 * The wallet ledger shows the 10 most recent rows and grows on demand.
 *
 * Three things are worth pinning down, because each has a silent failure mode:
 *  - the FIRST request asks for exactly 10 (asking for more and slicing in the view
 *    would pay for rows nobody reads, and would make "show more" a no-op);
 *  - "show more" must not blank the list while the wider window is in flight — the rows
 *    already on screen stay put, which is the whole promise of the button;
 *  - `hasMore` follows the BE's own `totalElements`, so the button disappears exactly
 *    when the reader has seen everything rather than one click too late.
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
    getMyTransactions: (params: unknown) => transactionsMock(params),
}))

import { store } from "@/redux/store"
import { setAuthenticated } from "@/redux/slices/keycloak"
import { setUser } from "@/redux/slices/user"
import { HISTORY_PAGE_SIZE, useQueryWalletSwr } from "./useQueryWalletSwr"
import type { UserEntity } from "@/modules/types/entities/user"

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

/** A ledger page of `count` rows, out of `total` the BE says it holds. */
const ledgerPage = (count: number, total: number) => ({
    items: Array.from({ length: count }, (_unused, index) => ({
        id: `tx-${index}`,
        type: "RECEIVE",
        status: "COMPLETED",
        direction: "IN",
        amount: 10,
        memo: `row-${index}`,
        createdAt: "2026-08-15T00:00:00Z",
    })),
    page: 0,
    totalElements: total,
})

const signIn = async (id: string) => {
    await act(async () => {
        window.localStorage.setItem("keycloak:access_token", `tok-${id}`)
        store.dispatch(setAuthenticated(true))
        store.dispatch(setUser({ id } as UserEntity))
    })
}

describe("wallet history — 10 rows, then show more", () => {
    beforeEach(() => {
        walletMock.mockReset()
        transactionsMock.mockReset()
        walletMock.mockResolvedValue({ balance: 100, status: "ACTIVE" })
        window.localStorage.clear()
        store.dispatch(setAuthenticated(false))
        store.dispatch(setUser(null))
    })

    it("asks for exactly 10 rows and offers more while the BE holds more", async () => {
        transactionsMock.mockResolvedValue(ledgerPage(HISTORY_PAGE_SIZE, 37))
        const { result } = renderHook(() => useQueryWalletSwr(), { wrapper })

        await signIn("user-a")
        await waitFor(() => expect(result.current.transactions).toHaveLength(HISTORY_PAGE_SIZE))

        expect(transactionsMock).toHaveBeenCalledWith(
            expect.objectContaining({ page: 0, size: HISTORY_PAGE_SIZE }),
        )
        expect(result.current.hasMore).toBe(true)
    })

    it("keeps the visible rows while the wider window loads, then shows 20", async () => {
        transactionsMock.mockResolvedValue(ledgerPage(HISTORY_PAGE_SIZE, 37))
        const { result } = renderHook(() => useQueryWalletSwr(), { wrapper })

        await signIn("user-a")
        await waitFor(() => expect(result.current.transactions).toHaveLength(HISTORY_PAGE_SIZE))

        // Hold the second window open so anything on screen can only be the first one.
        let releaseWider: (page: unknown) => void = () => undefined
        transactionsMock.mockImplementation(
            () => new Promise((resolve) => {
                releaseWider = resolve
            }),
        )

        await act(async () => {
            result.current.loadMore()
        })

        expect(transactionsMock).toHaveBeenLastCalledWith(
            expect.objectContaining({ page: 0, size: HISTORY_PAGE_SIZE * 2 }),
        )
        // The list did NOT collapse back to a skeleton/empty while loading.
        expect(result.current.transactions).toHaveLength(HISTORY_PAGE_SIZE)
        expect(result.current.isLoading).toBe(false)

        await act(async () => {
            releaseWider(ledgerPage(HISTORY_PAGE_SIZE * 2, 37))
        })
        await waitFor(() => expect(result.current.transactions).toHaveLength(HISTORY_PAGE_SIZE * 2))
    })

    it("stops offering more once every row is on screen", async () => {
        transactionsMock.mockResolvedValue(ledgerPage(4, 4))
        const { result } = renderHook(() => useQueryWalletSwr(), { wrapper })

        await signIn("user-a")
        await waitFor(() => expect(result.current.transactions).toHaveLength(4))

        expect(result.current.hasMore).toBe(false)
    })
})
