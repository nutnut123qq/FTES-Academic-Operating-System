"use client"

import {
    useEffect,
    useRef,
} from "react"
import {
    usePathname,
    useRouter,
    useSearchParams,
} from "next/navigation"
import {
    DASHBOARD_TABS,
    DEFAULT_DASHBOARD_TAB,
} from "../types"
import type {
    DashboardTab,
} from "../types"
import { useDashboardTabStore } from "@/hooks/zustand/dashboardTab/store"

/** Query-string key the active dashboard tab is mirrored to (`/dashboard?tab=...`). */
const TAB_QUERY_KEY = "tab"

/** Type guard: is a raw query value one of the known dashboard tabs? */
const isDashboardTab = (value: string | null): value is DashboardTab =>
    value != null && (DASHBOARD_TABS as ReadonlyArray<string>).includes(value)

/**
 * Two-way bind the shared dashboard-tab store to the URL query string, so the open
 * tab is shareable and back/forward friendly:
 *  - **URL → store**: the URL is the source of truth. A valid `?tab=` on load or on
 *    browser navigation selects that tab; a MISSING or unknown value resets the store to
 *    {@link DEFAULT_DASHBOARD_TAB}. That reset is what keeps a bare `/dashboard` link
 *    deterministic — the tab store is module-level and survives unmount, so without it a
 *    visitor who left from the Community tab would come back to Community (and have the
 *    address bar silently rewritten to `?tab=community`) on a link that carried no tab.
 *  - **store → URL**: switching tab rewrites `?tab=` via `router.replace`, so no scroll
 *    jump and no extra history entry per tab click (Back leaves the dashboard instead of
 *    stepping through every tab visited).
 *
 * A `fromUrl` ref breaks the echo loop between the two effects. The effect dependency
 * lists are deliberately narrow (`[queryTab]` / `[tab]`): `router.replace` settles
 * asynchronously, so widening them re-runs the adopt pass against a URL that has not
 * caught up yet and resets the tab (the trap documented in `useSetTabQuery`).
 * Mount once, in the dashboard root.
 */
export const useDashboardTabUrlSync = () => {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const tab = useDashboardTabStore((state) => state.tab)
    const setTab = useDashboardTabStore((state) => state.setTab)

    const queryTab = searchParams.get(TAB_QUERY_KEY)
    // marks the next `tab` change as URL-driven → skip echoing it back to the URL
    const fromUrlRef = useRef(false)

    // URL → store: adopt a valid ?tab on mount + on back/forward, and fall back to the
    // default when the URL carries none (the store is global and outlives the page).
    useEffect(() => {
        const next = isDashboardTab(queryTab) ? queryTab : DEFAULT_DASHBOARD_TAB
        if (next !== tab) {
            fromUrlRef.current = true
            setTab(next)
        }
    }, [queryTab])

    // store → URL: reflect the active tab in the query
    useEffect(() => {
        if (fromUrlRef.current) {
            fromUrlRef.current = false
            return
        }
        if (queryTab === tab) {
            return
        }
        const params = new URLSearchParams(searchParams.toString())
        params.set(TAB_QUERY_KEY, tab)
        router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    }, [tab])
}
