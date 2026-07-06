"use client"

import useSWR from "swr"

/** Kind of resume target — drives the chip icon + label. */
export type ResumeKind = "challenge" | "lesson"

/**
 * One "pick up where you left off" resume item — CONTENT-FIRST (recently-read
 * lessons lead, mixed with at most one in-progress challenge as a nudge).
 */
export interface ResumeItem {
    /** Stable id (would be an opaque global id against a real BE). */
    id: string
    /** Title to show. */
    label: string
    /** Challenge vs lesson (chip styling + kind caption). */
    kind: ResumeKind
    /** Destination when the learner presses "Continue". */
    href: string
}

/** Max number of resume cards shown. */
export const RESUME_LIMIT = 3

// ponytail: mock BE — no resume endpoint yet. Deterministic sample, content-first
// (lessons lead, one challenge nudge), SWR-shaped for a drop-in swap later.
const fetchResumeItemsMock = async (): Promise<Array<ResumeItem>> => [
    {
        id: "algorithms",
        label: "Cây nhị phân tìm kiếm",
        kind: "lesson",
        href: "/courses",
    },
    {
        id: "systemdesign",
        label: "Caching & CDN",
        kind: "lesson",
        href: "/courses",
    },
    {
        id: "two-sum",
        label: "Two Sum",
        kind: "challenge",
        href: "/challenges",
    },
]

/**
 * Loads the viewer's continue-learning resume items + a `hasCourses` flag so the
 * widget can show an onboarding CTA instead of an empty void. Mocked; SWR-shaped.
 */
export const useQueryContinueLearningSwr = () => {
    const { data, isLoading, error, mutate } = useSWR(
        ["analytics", "overview", "continue"],
        () => fetchResumeItemsMock(),
    )
    return {
        resumeItems: (data ?? []).slice(0, RESUME_LIMIT),
        hasCourses: true,
        isLoading,
        error,
        mutate,
    }
}
