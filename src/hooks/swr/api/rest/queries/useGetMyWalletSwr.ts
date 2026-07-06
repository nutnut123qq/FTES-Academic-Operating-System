"use client"

import useSWR from "swr"
import { getMyWallet, type WalletView } from "@/modules/api/rest/wallet"

/**
 * SWR query wrapper for {@link getMyWallet}.
 */
export const useGetMyWalletSwr = () => {
    const swr = useSWR<WalletView, Error>(["GET_MY_WALLET_SWR"], () =>
        getMyWallet(),
    )

    return swr
}
