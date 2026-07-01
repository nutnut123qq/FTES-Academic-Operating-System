"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"

/** The two top-level flashcard modes, each its own route slug. */
export type FlashcardMode = "study" | "interview"

/** URL slug per mode (English, reads in the path: `…/flashcards/review`). */
const MODE_SLUG: Record<FlashcardMode, string> = {
    study: "review",
    interview: "interview",
}

/**
 * URL-backed navigation for the flashcards surface. The MODE is a route segment
 * (`…/flashcards/review` | `…/flashcards/interview`) so each mode is its own page
 * with a readable English slug; the open deck / session ride as query params
 * (`?deck=<id>` · `?session=due`). The LEFT RAIL (rendered by the learn layout)
 * and the work PANE (the page) both read this hook → one source of truth across
 * the layout↔page boundary, like the content-map rail drives the reader by route.
 */
export const useFlashcardNav = () => {
    const router = useRouter()
    const pathname = usePathname()
    const params = useSearchParams()

    // last path segment carries the mode slug; `…/flashcards` (no slug) = study
    const segments = pathname.split("/")
    const lastSegment = segments[segments.length - 1]
    const mode: FlashcardMode = lastSegment === MODE_SLUG.interview ? "interview" : "study"
    // the flashcards root (strip a trailing mode slug if present)
    const root =
        lastSegment === MODE_SLUG.study || lastSegment === MODE_SLUG.interview
            ? segments.slice(0, -1).join("/")
            : pathname

    const deckId = params.get("deck")
    const session = params.get("session")

    /** Build a flashcards URL: the mode's route + (deck / session) query. */
    const build = (
        nextMode: FlashcardMode,
        opts: { deck?: string | null; session?: string | null } = {},
    ): string => {
        const next = new URLSearchParams()
        if (opts.deck) {
            next.set("deck", opts.deck)
        }
        if (opts.session) {
            next.set("session", opts.session)
        }
        const qs = next.toString()
        const path = `${root}/${MODE_SLUG[nextMode]}`
        return qs ? `${path}?${qs}` : path
    }

    return {
        /** Active mode (study | interview). */
        mode,
        /** Open deck id, or null (overview / topic picker). */
        deckId,
        /** Active session marker (`"due"` = cross-deck due session). */
        session,
        /** Switch mode (its own route; clears any open deck / session). */
        goMode: (nextMode: FlashcardMode) => router.push(build(nextMode, {})),
        /** Open a deck in the current mode's pane. */
        goDeck: (id: string) => router.push(build(mode, { deck: id })),
        /** Start the cross-deck due-review session. */
        goDue: () => router.push(build("study", { session: "due" })),
        /** Return the study pane to its overview (due + mastery). */
        goOverview: () => router.push(build("study", {})),
    }
}
