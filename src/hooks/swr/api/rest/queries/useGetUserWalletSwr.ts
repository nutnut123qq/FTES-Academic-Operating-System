"use client"

import useSWR from "swr"
import { getUserWallet, type WalletView } from "@/modules/api/rest/wallet"

/**
 * SWR query wrapper for {@link getUserWallet}.
 */
export const useGetUserWalletSwr = (userId: string) => {
    const swr = useSWR<WalletView, Error>(
        ["GET_USER_WALLET_SWR", userId],
        () => getUserWallet(userId),
    )

    return swr
}
