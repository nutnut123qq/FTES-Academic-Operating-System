"use client"

import useSWR from "swr"
import { COURSE_CATEGORIES, type CourseCategory } from "../browse/categories"

// ponytail: mock BE — no category endpoint yet. BE-SWAP POINT: replace this
// fetcher with the real category query (keep the CourseCategory shape; slugs
// are the stable contract) and the rest of the browse UI needs no change.
const fetchCourseCategoriesMock = async (): Promise<Array<CourseCategory>> =>
    COURSE_CATEGORIES

/**
 * Loads the course category taxonomy for the browse-by-category catalog.
 * Mocked; SWR-shaped for a drop-in BE swap (mirrors `useQueryFeaturedCoursesSwr`).
 * `categories` stays `undefined` while loading so callers can gate skeletons on `!data`.
 */
export const useQueryCourseCategoriesSwr = () => {
    const { data, isLoading, error } = useSWR(["course-categories"], () =>
        fetchCourseCategoriesMock(),
    )
    return { categories: data, isLoading, error }
}
