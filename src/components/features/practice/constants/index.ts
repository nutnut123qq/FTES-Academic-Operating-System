import type {
    DifficultyFilter,
    SortKey,
    StatusFilter,
} from "../types"
import { CodingDifficulty } from "@/modules/api/graphql/queries/types/coding"

/**
 * Page size requested from `codingProblems`. Phase 1 loads the whole catalog in
 * one page and filters/searches/sorts CLIENT-side (the backend only server-filters
 * difficulty + a single tag, with no status/domain facets or cursor paging). Real
 * server pagination + facets are deferred to phase 2.
 */
export const PROBLEMS_PAGE_LIMIT = 500

/**
 * CODING difficulty scale (easy/medium/hard) → semantic colour + StatusChip tone,
 * matching the profile Coding tab. easy → success/green, medium → warning/yellow,
 * hard → danger/red.
 */
export const CODING_DIFFICULTY_META: Record<
    CodingDifficulty,
    { color: string; tone: "success" | "warning" | "danger"; labelKey: string }
> = {
    [CodingDifficulty.Easy]: {
        color: "var(--success)",
        tone: "success",
        labelKey: "publicProfile.skillsSnapshot.diffEasy",
    },
    [CodingDifficulty.Medium]: {
        color: "var(--warning)",
        tone: "warning",
        labelKey: "publicProfile.skillsSnapshot.diffMedium",
    },
    [CodingDifficulty.Hard]: {
        color: "var(--danger)",
        tone: "danger",
        labelKey: "publicProfile.skillsSnapshot.diffHard",
    },
}

/** Difficulty filter chips, in display order (`all` first). */
export const DIFFICULTY_FILTERS: ReadonlyArray<DifficultyFilter> = [
    "all",
    CodingDifficulty.Easy,
    CodingDifficulty.Medium,
    CodingDifficulty.Hard,
]

/** Status filter chips, in display order (`all` first). */
export const STATUS_FILTERS: ReadonlyArray<StatusFilter> = [
    "all",
    "unsolved",
    "attempted",
    "solved",
]

/** Sort options surfaced in the sort `Select`. */
export const SORT_KEYS: ReadonlyArray<SortKey> = [
    "default",
    "difficulty",
    "points",
]

/** Difficulty ordering weight used by the "difficulty" sort (easy → hard). */
export const DIFFICULTY_ORDER: Record<CodingDifficulty, number> = {
    [CodingDifficulty.Easy]: 0,
    [CodingDifficulty.Medium]: 1,
    [CodingDifficulty.Hard]: 2,
}
