"use client"

import useSWR from "swr"
import { getMyWallet, type WalletView } from "@/modules/api/rest/wallet"
import { useAppSelector } from "@/redux/hooks"
import { useViewerScopeId } from "@/hooks/swr/viewerScope"

/**
 * SWR query wrapper for {@link getMyWallet} (`GET /api/v1/wallet/me`).
 *
 * Auth-gated: guests key to `null` so the `/me` wallet endpoint is never fired
 * (no 401 + retry storm) and `data === undefined`. Same gate as the other live
 * gamification hooks; the quest-board header reads the wallet balance chip.
 *
 * The key also carries the VIEWER ID ({@link useViewerScopeId}) — this is a WALLET
 * BALANCE, so a cross-account read is a money-shaped leak. On the bare
 * `["GET_MY_WALLET_SWR"]` key, signing out of A and into B in the SAME TAB re-keys to
 * that identical entry: SWR paints A's balance for B from cache and, inside
 * `dedupingInterval`, may not even re-fetch. The sign-out BUTTON flushes the cache,
 * but a revoked / expired session does not — the key itself is what closes the hole.
 *
 * Callers that need to refresh after a top-up must use the BOUND `mutate()` this hook
 * returns; never rebuild the key array by hand, or the identity segment drifts and the
 * revalidation silently misses.
 */
export const useGetMyWalletSwr = () => {
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const viewerId = useViewerScopeId()
    const swr = useSWR<WalletView, Error>(
        authenticated && viewerId ? ["GET_MY_WALLET_SWR", viewerId] : null,
        () => getMyWallet(),
    )

    return swr
}
