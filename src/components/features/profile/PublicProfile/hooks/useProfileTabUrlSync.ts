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
    PROFILE_TABS,
} from "../types"
import type {
    ProfileTab,
} from "../types"
import { useProfileTabStore } from "@/hooks/zustand/profileTab/store"

/** Query-string key the active profile tab is mirrored to (`/profile?tab=...`). */
const TAB_QUERY_KEY = "tab"

/** Type guard: is a raw query value one of the known profile tabs? */
const isProfileTab = (value: string | null): value is ProfileTab =>
    value != null && (PROFILE_TABS as ReadonlyArray<string>).includes(value)

/**
 * Two-way bind the shared profile-tab store to the URL query string, so the open
 * tab is shareable / bookmarkable / back-forward friendly:
 *  - **URL → store**: a valid `?tab=` on load or browser nav selects that tab.
 *  - **store → URL**: switching tab (the strip, or any "see all" jump) rewrites
 *    `?tab=` with `router.replace` (no history spam, no scroll jump).
 *
 * The store stays the single runtime source the panels switch on; this hook is the
 * only place that touches the URL, so every existing `setTab` caller keeps working
 * untouched. A `fromUrl` ref breaks the echo loop: a store change caused by URL
 * adoption is not written back to the URL. Mount it once, in the profile page root.
 */
export const useProfileTabUrlSync = () => {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const tab = useProfileTabStore((state) => state.tab)
    const setTab = useProfileTabStore((state) => state.setTab)

    const queryTab = searchParams.get(TAB_QUERY_KEY)
    // marks the next `tab` change as URL-driven → skip echoing it back to the URL
    const fromUrlRef = useRef(false)

    // URL → store: adopt a valid ?tab on mount + on back/forward (keyed on the URL)
    useEffect(() => {
        if (isProfileTab(queryTab) && queryTab !== tab) {
            fromUrlRef.current = true
            setTab(queryTab)
        }
    }, [queryTab])

    // store → URL: reflect the active tab in the query (keyed on the tab)
    useEffect(() => {
        // this change came from the URL → consume the flag, don't write back
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
