"use client"

import {
    useCallback,
    useMemo,
} from "react"
import {
    usePathname,
    useRouter,
    useSearchParams,
} from "next/navigation"

/** The two top-level practice views, mirrored to the `?view=` URL param. */
export type PracticeView = "problems" | "leaderboard"

/** Query key the active view is mirrored to (`/practice?view=leaderboard`). */
const VIEW_KEY = "view"

/** The handle returned by {@link usePracticeView}. */
export interface UsePracticeViewResult {
    /** The active view (defaults to `problems`). */
    view: PracticeView
    /** Switch the active view, rewriting the URL query. */
    setView: (view: PracticeView) => void
}

/**
 * Read/write the top-level practice view (Problems ⇄ Leaderboard) through the URL
 * `?view=` param, so the docs-style left rail (the mode switch) and the work pane
 * share one source of truth and the view is shareable / back-forward friendly.
 * Mirrors the flashcards `useFlashcardNav` split (rail + pane read the same URL).
 * The default (`problems`) is dropped from the query to keep the URL clean.
 *
 * @returns the active {@link PracticeView} plus its setter.
 */
export const usePracticeView = (): UsePracticeViewResult => {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    const view = useMemo<PracticeView>(
        () => (searchParams.get(VIEW_KEY) === "leaderboard" ? "leaderboard" : "problems"),
        [searchParams],
    )

    const setView = useCallback((next: PracticeView) => {
        const params = new URLSearchParams(searchParams.toString())
        if (next === "leaderboard") {
            params.set(VIEW_KEY, next)
        } else {
            params.delete(VIEW_KEY)
        }
        const queryString = params.toString()
        router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false })
    }, [pathname, router, searchParams])

    return { view, setView }
}
