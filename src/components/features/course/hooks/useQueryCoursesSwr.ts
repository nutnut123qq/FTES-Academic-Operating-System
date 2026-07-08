"use client"

import useSWR from "swr"
import { getCourses } from "@/modules/api/rest/course"
import type { CourseSummary } from "@/modules/api/rest/course"

/** Course level. */
export type CourseLevel = "basic" | "intermediate" | "advanced"

/** Merchandising badge on a catalog card (mock flag; BE defines real criteria later). */
export type CourseBadge = "bestseller" | "new"

/** A course in the catalog (§4). */
export interface Course {
    id: string
    code: string
    name: string
    level: CourseLevel
    credits: number
    lessons: number
    /** Category slug — joins `CourseCategory.slug` (exactly one per course). */
    category: string
    /** Average rating 0–5; absent → the card hides its rating row. */
    rating?: number
    /** Number of ratings behind {@link Course.rating}. */
    ratingCount?: number
    /** Total enrolled learners; absent → the card hides its learners chip. */
    enrollmentCount?: number
    /** Total video/content hours; absent → the card falls back to credits. */
    durationHours?: number
    /** Charged price in VND; absent → the card hides its price row. */
    priceVnd?: number
    /** Cover image URL; the card keeps a branded gradient fallback behind it. */
    coverUrl?: string
    /** Optional merchandising badge (Bán chạy / Mới). */
    badge?: CourseBadge
    /** Sale mode — "LEGACY" (whole-course price) or "PACKAGE" (sold via packages/combo). */
    saleMode?: string
    /** Short summary shown by the hover preview; assumed on the future BE list endpoint. */
    description?: string
    /** "What you'll learn" bullets for the hover preview; assumed on the future BE list endpoint. */
    learnOutcomes?: Array<string>
    /** ISO date of the last content update; assumed on the future BE list endpoint. */
    updatedAt?: string
}

/**
 * Single catalog bucket slug. The BE list carries an opaque `categoryId` (uuid)
 * with no public name taxonomy yet, so every course maps to one honest
 * "all courses" shelf rather than fabricating category membership. Matches the
 * lone category returned by `useQueryCourseCategoriesSwr` (BE-swap point).
 */
export const CATALOG_CATEGORY_SLUG = "all"

/**
 * Maps the BE course level string onto the catalog's three-level facet. The BE
 * currently only seeds `UNIVERSITY`, which has no direct facet equivalent → it
 * (and any unknown value) degrades to `intermediate` for display; a wrong facet
 * label is preferable to a broken i18n key.
 *
 * @param level - The raw BE `level` string (nullable).
 * @returns The closest catalog {@link CourseLevel}.
 */
export const mapCourseLevel = (level: string | null | undefined): CourseLevel => {
    const value = (level ?? "").toUpperCase()
    if (value.includes("BASIC") || value.includes("BEGIN") || value.includes("FOUND")) {
        return "basic"
    }
    if (value.includes("ADVANC") || value.includes("EXPERT")) {
        return "advanced"
    }
    return "intermediate"
}

/**
 * Adapts a BE {@link CourseSummary} into the catalog card {@link Course}. Fields
 * the BE summary lacks (credits, lesson count, ratingCount, description,
 * learnOutcomes) stay `undefined` so each card row degrades gracefully. The
 * routing id is the `slugName` because the detail endpoint keys on it.
 *
 * @param summary - One BE course summary row.
 * @returns The catalog card model.
 */
const toCourse = (summary: CourseSummary): Course => {
    const sale = Number(summary.salePrice)
    const total = Number(summary.totalPrice)
    const priceVnd =
        Number.isFinite(sale) && sale > 0
            ? sale
            : Number.isFinite(total) && total > 0
                ? total
                : undefined
    const star = Number(summary.avgStar)
    return {
        id: summary.slugName,
        code: summary.courseCode,
        name: summary.title,
        level: mapCourseLevel(summary.level),
        credits: 0,
        lessons: 0,
        category: CATALOG_CATEGORY_SLUG,
        rating: Number.isFinite(star) && star > 0 ? star : undefined,
        ratingCount: undefined,
        enrollmentCount: summary.totalUser ?? undefined,
        durationHours: undefined,
        priceVnd,
        coverUrl: summary.imageHeader || undefined,
        badge: undefined,
        saleMode: summary.saleMode,
        description: undefined,
        learnOutcomes: undefined,
        updatedAt: undefined,
    }
}

/** Sort orders of the browse facet bar. */
export type CourseSort = "popular" | "newest" | "rating"

// Comparators over the mapped card fields. `popular` ranks by learners (the
// only real popularity signal on the summary), `newest` keeps curated order
// (no createdAt on the summary), `rating` by avg star.
const COURSE_COMPARATORS: Record<CourseSort, (a: Course, b: Course) => number> = {
    popular: (a, b) => (b.enrollmentCount ?? 0) - (a.enrollmentCount ?? 0),
    newest: (a, b) => Number(b.badge === "new") - Number(a.badge === "new"),
    rating: (a, b) => (b.rating ?? 0) - (a.rating ?? 0),
}

/**
 * Filters courses down to one category.
 *
 * @param courses - The full course list.
 * @param slug - The category slug to keep.
 * @returns The courses whose `category` matches `slug`.
 */
export const coursesByCategory = (courses: Array<Course>, slug: string): Array<Course> =>
    courses.filter((course) => course.category === slug)

/**
 * Returns a new array sorted by the given browse sort order (stable — ties keep
 * the incoming order).
 *
 * @param courses - The courses to sort.
 * @param sort - The active sort order.
 * @returns A sorted copy of `courses`.
 */
export const sortCourses = (courses: Array<Course>, sort: CourseSort): Array<Course> =>
    [...courses].sort(COURSE_COMPARATORS[sort])

/**
 * Loads the course catalog from the public REST endpoint
 * (`GET /api/v1/courses`) and adapts each row to the catalog card model.
 * SWR-cached under a stable key; `courses` defaults to `[]` while loading.
 */
export const useQueryCoursesSwr = () => {
    const { data, isLoading, error, mutate } = useSWR(["rest-courses"], async () => {
        const list = await getCourses({ size: 100 })
        return list.map(toCourse)
    })
    return { courses: data ?? [], isLoading, error, mutate }
}
