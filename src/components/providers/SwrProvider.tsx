
import React from "react"
import { SWRConfig } from "swr"

/**
 * Global SWR provider. Centralises revalidation defaults so the ~40 singleton
 * query hooks mounted once in {@link SingletonHookProvider} stop refetching on
 * every window focus / network reconnect (the main source of constant refetching).
 *
 * Hooks that genuinely need fresh data (e.g. job polling) opt back in locally
 * via their own `refreshInterval` / `revalidateOnFocus` option.
 */
export const SwrProvider = ({ children }: { children: React.ReactNode }) => {
    return (
        <SWRConfig value={{
            /** Isolated in-memory cache for this app instance. */
            provider: () => new Map(),
            /** Don't refetch every time the tab regains focus. */
            revalidateOnFocus: false,
            /** Don't refetch on network reconnect by default. */
            revalidateOnReconnect: false,
            /** Collapse duplicate requests for the same key within 1 minute. */
            dedupingInterval: 60_000,
            /** Cap retry storms on persistent errors. */
            errorRetryCount: 2,
            /**
             * Default `false` to match the loading-gate rule (key change → `data` undefined → skeleton),
             * avoiding stale data when the context id changes (content/challenge/module...).
             * PURE pagination hooks (same context, change by page) opt back in to `true` locally.
             */
            keepPreviousData: false,
        }}>
            {children}
        </SWRConfig>
    )
}
