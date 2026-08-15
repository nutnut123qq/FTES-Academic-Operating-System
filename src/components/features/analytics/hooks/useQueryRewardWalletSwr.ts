"use client"

import useSWR from "swr"
import { getMyWallet } from "@/modules/api/rest/wallet"
import { useViewerScopeId } from "@/hooks/swr/viewerScope"
import { useAppSelector } from "@/redux/hooks"

/** The viewer's reward wallet. */
export interface RewardWallet {
    /** Spendable reward-point balance. */
    balance: number
}

/**
 * Loads the viewer's spendable balance from the real wallet REST API (`GET /wallet/me`).
 *
 * The key carries the VIEWER ID ({@link useViewerScopeId}) and doubles as the fetch
 * gate — a balance is the most obviously per-account number on the dashboard, and
 * `GET /wallet/me` needs a token, so a signed-out viewer must not call it at all.
 */
export const useQueryRewardWalletSwr = () => {
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const viewerId = useViewerScopeId()
    const { data, isLoading, error, mutate } = useSWR(
        authenticated && viewerId ? ["analytics", "overview", "reward", viewerId] : null,
        async (): Promise<RewardWallet> => {
            const wallet = await getMyWallet()
            return { balance: wallet.balance ?? 0 }
        },
    )
    return { data, isLoading, error, mutate }
}
