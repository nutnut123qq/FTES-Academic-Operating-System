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
import type {
    DifficultyFilter,
    DomainFilter,
    PracticeFilters,
    SortKey,
    StatusFilter,
} from "../types"
import { CodingDifficulty, CodingDomain } from "@/modules/api/graphql/queries/types/coding"

/** Query-string keys the catalog filters are mirrored to (`/practice?...`). */
const QUERY_KEYS = {
    q: "q",
    difficulty: "difficulty",
    status: "status",
    domain: "domain",
    group: "group",
    sort: "sort",
} as const

/** Valid difficulty filter values (string set for URL validation). */
const DIFFICULTY_VALUES: ReadonlyArray<string> = [
    "all",
    ...Object.values(CodingDifficulty),
]

/** Valid status filter values. */
const STATUS_VALUES: ReadonlyArray<string> = ["all", "unsolved", "attempted", "solved"]

/** Valid domain filter values. */
const DOMAIN_VALUES: ReadonlyArray<string> = ["all", ...Object.values(CodingDomain)]

/** Valid sort values. */
const SORT_VALUES: ReadonlyArray<string> = ["default", "difficulty", "points"]

/**
 * Coerce a raw query value to one of an allowed set, falling back to the default.
 */
const coerce = <T extends string>(
    raw: string | null,
    allowed: ReadonlyArray<string>,
    fallback: T,
): T => (raw != null && allowed.includes(raw) ? (raw as T) : fallback)

/** The handle returned by {@link usePracticeFilters}. */
export interface UsePracticeFiltersResult {
    /** The decoded filter state. */
    filters: PracticeFilters
    /** Patch one or more filter fields and rewrite the URL query. */
    setFilters: (patch: Partial<PracticeFilters>) => void
    /** Reset every filter back to its default (clears the query). */
    clearFilters: () => void
    /** Whether any filter is set away from its default (catalog is narrowed). */
    isFiltered: boolean
}

/**
 * Read/write the practice-catalog filter state through the URL search params, so a
 * filtered/searched view is shareable and back-forward friendly. The URL is the
 * single source of truth — there is no local mirror, so no echo loop. Every
 * container in the feature reads this hook directly (props discipline) rather than
 * threading filter state down as props.
 *
 * @returns the decoded {@link PracticeFilters} plus setters.
 */
export const usePracticeFilters = (): UsePracticeFiltersResult => {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    // decode the current query into typed filter state
    const filters = useMemo<PracticeFilters>(() => ({
        q: searchParams.get(QUERY_KEYS.q) ?? "",
        difficulty: coerce<DifficultyFilter>(
            searchParams.get(QUERY_KEYS.difficulty),
            DIFFICULTY_VALUES,
            "all",
        ),
        status: coerce<StatusFilter>(
            searchParams.get(QUERY_KEYS.status),
            STATUS_VALUES,
            "all",
        ),
        domain: coerce<DomainFilter>(
            searchParams.get(QUERY_KEYS.domain),
            DOMAIN_VALUES,
            "all",
        ),
        // group-by-domain is the default view; only "0" turns it off
        group: searchParams.get(QUERY_KEYS.group) !== "0",
        sort: coerce<SortKey>(searchParams.get(QUERY_KEYS.sort), SORT_VALUES, "default"),
    }), [searchParams])

    const isFiltered = filters.q.trim() !== ""
        || filters.difficulty !== "all"
        || filters.status !== "all"
        || filters.domain !== "all"

    const setFilters = useCallback((patch: Partial<PracticeFilters>) => {
        const params = new URLSearchParams(searchParams.toString())
        const next: PracticeFilters = { ...filters, ...patch }

        // write each field, dropping defaults to keep the URL clean
        if (next.q.trim()) {
            params.set(QUERY_KEYS.q, next.q)
        } else {
            params.delete(QUERY_KEYS.q)
        }
        if (next.difficulty !== "all") {
            params.set(QUERY_KEYS.difficulty, next.difficulty)
        } else {
            params.delete(QUERY_KEYS.difficulty)
        }
        if (next.status !== "all") {
            params.set(QUERY_KEYS.status, next.status)
        } else {
            params.delete(QUERY_KEYS.status)
        }
        if (next.domain !== "all") {
            params.set(QUERY_KEYS.domain, next.domain)
        } else {
            params.delete(QUERY_KEYS.domain)
        }
        if (!next.group) {
            params.set(QUERY_KEYS.group, "0")
        } else {
            params.delete(QUERY_KEYS.group)
        }
        if (next.sort !== "default") {
            params.set(QUERY_KEYS.sort, next.sort)
        } else {
            params.delete(QUERY_KEYS.sort)
        }

        const queryString = params.toString()
        router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false })
    }, [filters, pathname, router, searchParams])

    const clearFilters = useCallback(() => {
        router.replace(pathname, { scroll: false })
    }, [pathname, router])

    return { filters, setFilters, clearFilters, isFiltered }
}
