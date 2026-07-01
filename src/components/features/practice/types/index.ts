import type { CodingDifficulty, CodingDomain } from "@/modules/api/graphql/queries/types/coding"

/**
 * Per-problem solve status overlaid from `myCodingProgress`:
 * - `solved`: the user has an Accepted submission.
 * - `attempted`: the user submitted but never got Accepted.
 * - `unsolved`: the user has not submitted to it.
 */
export type ProblemStatus = "solved" | "attempted" | "unsolved"

/**
 * Status filter applied to the catalog (`all` keeps every status). Mirrors the
 * three {@link ProblemStatus} buckets plus the catch-all.
 */
export type StatusFilter = "all" | ProblemStatus

/** Difficulty filter applied to the catalog (`all` keeps every difficulty). */
export type DifficultyFilter = "all" | CodingDifficulty

/** Domain filter applied to the catalog (`all` keeps every domain). */
export type DomainFilter = "all" | CodingDomain

/** How the catalog rows are ordered (within each group, or globally when flat). */
export type SortKey = "default" | "difficulty" | "points"

/**
 * The decoded practice-catalog filter state, mirrored to the URL query string by
 * {@link import("../hooks/usePracticeFilters").usePracticeFilters}.
 */
export interface PracticeFilters {
    /** Free-text title query (client-side `includes` match). */
    q: string
    /** Active difficulty filter. */
    difficulty: DifficultyFilter
    /** Active status filter. */
    status: StatusFilter
    /** Active domain filter. */
    domain: DomainFilter
    /** Whether the catalog is grouped by domain (vs a flat list). */
    group: boolean
    /** Active sort order. */
    sort: SortKey
}
