"use client"

import {
    useCallback,
    useRef,
} from "react"
import {
    usePathname,
    useRouter,
    useSearchParams,
} from "next/navigation"

/** Query-string key the selected course globalId is mirrored to (`?course=...`). */
const COURSE_QUERY_KEY = "course"

/** Return shape of {@link useSelectedCourse}. */
export interface UseSelectedCourseResult {
    /** Currently selected course globalId, or `null` when on the hub view. */
    selectedCourse: string | null
    /** Select a course (writes `?course=<globalId>`), or clear it (`null`). */
    setSelectedCourse: (globalId: string | null) => void
}

/**
 * Drive the learning-hub view off a `?course=<globalId>` search param: no param
 * shows the course hub grid, a present param opens that course's outline. The
 * single place that reads / writes the `course` query. A `fromUrl` ref keeps the
 * setter idempotent against the param it would echo (no redundant navigation).
 *
 * Mirrors the `useProfileTabUrlSync` URL-state pattern, but kept self-contained
 * (no shared store): the URL is the source of truth and the only state.
 */
export const useSelectedCourse = (): UseSelectedCourseResult => {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    const selectedCourse = searchParams.get(COURSE_QUERY_KEY)
    // remembers the last value we wrote so we never re-navigate to the same param
    const lastWrittenRef = useRef<string | null>(null)

    const setSelectedCourse = useCallback(
        (globalId: string | null) => {
            if (lastWrittenRef.current === globalId && selectedCourse === globalId) {
                return
            }
            lastWrittenRef.current = globalId
            const params = new URLSearchParams(searchParams.toString())
            if (globalId) {
                params.set(COURSE_QUERY_KEY, globalId)
            } else {
                params.delete(COURSE_QUERY_KEY)
            }
            const queryString = params.toString()
            router.replace(
                queryString ? `${pathname}?${queryString}` : pathname,
                { scroll: false },
            )
        },
        [
            pathname,
            router,
            searchParams,
            selectedCourse,
        ],
    )

    return {
        selectedCourse,
        setSelectedCourse,
    }
}
