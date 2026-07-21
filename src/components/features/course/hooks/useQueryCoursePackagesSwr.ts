"use client"

import useSWR from "swr"
import { getCoursePackages } from "@/modules/api/rest/course"
import type { PackageView } from "@/modules/api/rest/course"

/** Result of {@link useQueryCoursePackagesSwr}. */
export interface UseCoursePackagesResult {
    /** The course's public packages (empty while loading, on error, or when none). */
    packages: Array<PackageView>
    /** True while the request is in flight. */
    isLoading: boolean
    /** True when the request failed (the endpoint may still 500 until the BE deploys). */
    isError: boolean
    /** True when the request succeeded but the course has no packages yet. */
    isEmpty: boolean
    /** Re-runs the request — wire it to the error state's "Thử lại" button. */
    retry: () => void
}

/**
 * Loads a PACKAGE course's public packages from
 * `GET /api/v1/courses/{id}/packages` (the id is the course UUID = `course.rawId`,
 * NOT the slug). Keyed on that raw id and gated by `enabled` so it never fires for
 * a LEGACY course.
 *
 * Degrades gracefully: an error or an empty list returns `packages: []` and the
 * corresponding `isError` / `isEmpty` flag so the UI can show "Đang cập nhật gói"
 * instead of crashing — the endpoint may keep 500-ing until the BE deploys.
 *
 * @param rawId - The course UUID (`course.rawId`).
 * @param options - `enabled` gates the request (only PACKAGE courses).
 */
export const useQueryCoursePackagesSwr = (
    rawId: string | undefined,
    options?: { enabled?: boolean },
): UseCoursePackagesResult => {
    const enabled = options?.enabled !== false
    const active = Boolean(enabled && rawId)
    const { data, isLoading, error, mutate } = useSWR(
        active ? ["COURSE_PACKAGES_SWR", rawId] : null,
        () => getCoursePackages(rawId as string),
        { shouldRetryOnError: false },
    )
    // Sort once here so every consumer (picker + default pick) renders a stable
    // order — the BE list order is arbitrary. sortOrder asc, then price asc.
    const packages = [...(data ?? [])].sort(
        (a, b) => a.sortOrder - b.sortOrder || Number(a.salePrice) - Number(b.salePrice),
    )
    return {
        packages,
        isLoading: active && isLoading,
        isError: Boolean(error),
        isEmpty: active && !isLoading && !error && packages.length === 0,
        retry: () => {
            void mutate()
        },
    }
}
