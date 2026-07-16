"use client"

import useSWR from "swr"
import { getMyWallet, type WalletView } from "@/modules/api/rest/wallet"
import { useAppSelector } from "@/redux/hooks"

/**
 * SWR query wrapper for {@link getMyWallet} (`GET /api/v1/wallet/me`).
 *
 * Auth-gated: guests key to `null` so the `/me` wallet endpoint is never fired
 * (no 401 + retry storm) and `data === undefined`. Same gate as the other live
 * gamification hooks; the quest-board header reads the wallet balance chip.
 */
export const useGetMyWalletSwr = () => {
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const swr = useSWR<WalletView, Error>(
        authenticated ? ["GET_MY_WALLET_SWR"] : null,
        () => getMyWallet(),
    )

    return swr
}
