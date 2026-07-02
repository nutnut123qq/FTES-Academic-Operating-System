"use client"

import { useCallback, useEffect, useState } from "react"

/** localStorage key holding the device-local recent-search list (MRU, JSON string array). */
const RECENT_SEARCHES_KEY = "ftes.search.recent"

/** Maximum number of recent queries kept (most-recent-first). */
const MAX_RECENT = 8

/** Read the recent list from storage, degrading to `[]` on any failure (private mode / SSR). */
const readRecent = (): Array<string> => {
    try {
        const raw = window.localStorage.getItem(RECENT_SEARCHES_KEY)
        if (!raw) return []
        const parsed: unknown = JSON.parse(raw)
        if (!Array.isArray(parsed)) return []
        return parsed.filter((item): item is string => typeof item === "string")
    } catch {
        return []
    }
}

/** Persist the recent list, swallowing quota/security errors (fail-silent). */
const writeRecent = (items: Array<string>): void => {
    try {
        window.localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(items))
    } catch {
        // storage unavailable (private mode / quota) → no-op; feature degrades to in-memory only.
    }
}

/**
 * Device-local recent-search history for the global search surfaces.
 *
 * Backed by `localStorage` key `ftes.search.recent`: most-recent-first, deduped
 * (case-insensitive), trimmed, capped at 8. All storage access is wrapped in
 * try/catch so private-mode / quota failures degrade silently to an empty,
 * no-op feature. Hydrated once on mount (SSR-safe — reads happen in an effect).
 * @returns the current list plus `add(query)` and `clear()` actions.
 */
export const useRecentSearches = (): {
    readonly recent: Array<string>
    add: (query: string) => void
    clear: () => void
} => {
    const [recent, setRecent] = useState<Array<string>>([])

    useEffect(() => {
        setRecent(readRecent())
    }, [])

    const add = useCallback((query: string) => {
        const trimmed = query.trim()
        if (!trimmed) return
        setRecent((prev) => {
            const deduped = prev.filter((item) => item.toLowerCase() !== trimmed.toLowerCase())
            const next = [trimmed, ...deduped].slice(0, MAX_RECENT)
            writeRecent(next)
            return next
        })
    }, [])

    const clear = useCallback(() => {
        writeRecent([])
        setRecent([])
    }, [])

    return { recent, add, clear }
}
