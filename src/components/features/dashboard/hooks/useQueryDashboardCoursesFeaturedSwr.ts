"use client"

import { useMemo } from "react"
import { useQueryRecommendedCoursesSwr } from "@/hooks/swr/api/graphql/queries/useQueryRecommendedCoursesSwr"
import { useQueryMyCoursesSwr } from "@/components/features/course/hooks/useQueryMyCoursesSwr"

/** How many catalog rows the dashboard rail shows (the tab is about MY courses first). */
export const FEATURED_COURSE_LIMIT = 4

/**
 * One catalog course offered on the dashboard COURSES tab.
 *
 * Only fields the backend fills with real values are modelled. The
 * `recommendedCourses` resolver hardcodes `discountReason` to `"none"`,
 * `enrolledCount` to `0` and both USD prices to `null`, so those are deliberately
 * NOT part of this row — a widget must not dress a constant up as a fact.
 */
export interface FeaturedCourse {
    /** Course slug — the row key AND the `/courses/{slug}` route segment (NOT a uuid). */
    slug: string
    /** Course title. */
    title: string
    /** Cover image URL (already Cloudinary-optimised by the backend), or `null`. */
    thumbnailUrl: string | null
    /** The price actually charged, in VND. */
    priceVnd: number
    /** List price in VND when it is genuinely higher than {@link priceVnd}; otherwise `null`. */
    originalPriceVnd: number | null
}

/**
 * The dashboard COURSES tab's catalog rail.
 *
 * Reads the real `recommendedCourses` GraphQL query (the first published courses,
 * priced) and subtracts the courses the viewer is already enrolled in, matching the
 * query's `displayId` against each enrollment's SLUG — `displayId` is
 * `course.slugName`, not a uuid, so a uuid-based join would silently match nothing.
 *
 * The backend does no viewer scoping, no ranking and no "already enrolled" filter of
 * its own, so this rail is presented as a plain catalog rail, never as a personalised
 * recommendation. Both leaf queries are auth-gated by their own hooks; guests get an
 * empty list and the section self-hides.
 */
export const useQueryDashboardCoursesFeaturedSwr = () => {
    const { data, isLoading, error, mutate } = useQueryRecommendedCoursesSwr()
    const {
        courses: enrolled,
        isLoading: isLoadingEnrolled,
        error: enrolledError,
    } = useQueryMyCoursesSwr()

    const items = useMemo(
        (): Array<FeaturedCourse> => {
            const ownedSlugs = new Set(enrolled.map((course) => course.slug))
            return (data?.items ?? [])
                .filter((item) => !ownedSlugs.has(item.displayId))
                .slice(0, FEATURED_COURSE_LIMIT)
                .map((item) => ({
                    slug: item.displayId,
                    title: item.title,
                    thumbnailUrl: item.thumbnailUrl,
                    priceVnd: item.discountedPriceVnd,
                    originalPriceVnd:
                        item.originalPriceVnd > item.discountedPriceVnd
                            ? item.originalPriceVnd
                            : null,
                }))
        },
        [
            data,
            enrolled,
        ],
    )

    return {
        items,
        // the enrollment list is part of the ANSWER (it subtracts owned courses), so the
        // rail stays in its skeleton until both land — otherwise a course the viewer
        // already owns flashes in and then vanishes.
        isLoading: isLoading || isLoadingEnrolled,
        // an enrollment failure is FATAL for this rail, not a silent empty set: with
        // `enrolled` fallen back to [] the "already owned" subtraction removes nothing,
        // so the rail would offer — with a price tag and a link to checkout — courses
        // the viewer has already paid for. Surface error+retry instead of mis-selling.
        error: error ?? enrolledError,
        mutate,
    }
}
