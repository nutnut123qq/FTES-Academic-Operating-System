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
 * tab is shareable / back-forward friendly (mirror of the profile-page pattern):
 *  - **URL → store**: a valid `?tab=` on load or browser nav selects that tab.
 *  - **store → URL**: switching tab rewrites `?tab=` via `router.replace` (no scroll
 *    jump, no history spam).
 * A `fromUrl` ref breaks the echo loop. Mount once, in the dashboard page root.
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

    // URL → store: adopt a valid ?tab on mount + on back/forward
    useEffect(() => {
        if (isDashboardTab(queryTab) && queryTab !== tab) {
            fromUrlRef.current = true
            setTab(queryTab)
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
