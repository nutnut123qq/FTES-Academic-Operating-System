"use client"

import useSWR from "swr"
import { getCourseCategories } from "@/modules/api/rest/course"
import { toCourseCategory } from "../browse/categories"

/**
 * Loads the course category taxonomy for the browse-by-category catalog from the
 * REAL public endpoint (`GET /api/v1/courses/categories`, non-empty categories
 * only) and maps each BE row to the browse-view `CourseCategory` (attaching the
 * derived presentation accent). The chip bar prepends its own "All" chip, so this
 * returns just the real categories — `slug` is the stable route/identity key.
 *
 * `name`/`description` are used verbatim from the BE (locale-resolved server-side,
 * or a single language); they are NOT translated client-side. `categories` stays
 * `undefined` while loading so callers can gate skeletons on `!data`.
 */
export const useQueryCourseCategoriesSwr = () => {
    const { data, isLoading, error } = useSWR(["course-categories"], async () => {
        const list = await getCourseCategories(true)
        return list.map(toCourseCategory)
    })
    return { categories: data, isLoading, error }
}
