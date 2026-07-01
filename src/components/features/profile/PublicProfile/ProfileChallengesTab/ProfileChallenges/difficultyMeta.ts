import type { Difficulty } from "@/components/blocks/chips/DifficultyChip"
import type { QueryUserSolvedChallengeItemData } from "@/modules/api/graphql/queries/types/user-solved-challenges"

/** Color + display level per raw challenge difficulty (the 4-tone difficulty scale). */
interface DifficultyMeta {
    /** The {@link Difficulty} level used for the per-row chip. */
    level: Difficulty
    /** SegmentBar slice / legend colour token (data-driven, fed to `color`). */
    color: string
}

/**
 * Raw challenge difficulty → display meta. easy=green, medium=yellow, hard=red,
 * insane/expert=purple (the dedicated `--difficulty-insane` token). Colours are
 * semantic tokens, never hex.
 */
const DIFFICULTY_META: Record<string, DifficultyMeta> = {
    easy: { level: "beginner", color: "var(--success)" },
    medium: { level: "intermediate", color: "var(--warning)" },
    hard: { level: "advanced", color: "var(--danger)" },
    insane: { level: "insane", color: "var(--difficulty-insane)" },
    expert: { level: "insane", color: "var(--difficulty-insane)" },
}

/** Canonical easy→hardest order for the bar slices + legend. */
const DIFFICULTY_ORDER: ReadonlyArray<string> = ["easy", "medium", "hard", "insane", "expert"]

/** Capitalize the first character of a key for display. */
const capitalize = (value: string): string =>
    value.charAt(0).toUpperCase() + value.slice(1)

/** One {@link import("@/components/blocks").SegmentBar} slice for a difficulty bucket. */
export interface DifficultySegment {
    /** Stable key (the raw difficulty). */
    key: string
    /** Legend label (the difficulty level, capitalized). */
    label: string
    /** Number of challenges at this difficulty. */
    value: number
    /** Slice + dot colour token. */
    color: string
}

/**
 * Build the difficulty distribution (easy→hardest, empty buckets dropped) for a
 * set of solved challenges, as {@link import("@/components/blocks").SegmentBar}
 * segments coloured by the 4-tone difficulty scale.
 *
 * @param items - solved-challenge rows to tally.
 * @returns ordered segments, one per non-empty difficulty bucket.
 */
export const buildDifficultySegments = (
    items: ReadonlyArray<QueryUserSolvedChallengeItemData>,
): Array<DifficultySegment> => {
    const counts: Record<string, number> = {}
    for (const item of items) {
        if (item.difficulty) {
            counts[item.difficulty] = (counts[item.difficulty] ?? 0) + 1
        }
    }
    return DIFFICULTY_ORDER
        .filter((raw) => (counts[raw] ?? 0) > 0)
        .map((raw) => ({
            key: raw,
            label: capitalize(DIFFICULTY_META[raw].level),
            value: counts[raw],
            color: DIFFICULTY_META[raw].color,
        }))
}

/** Fixed difficulty legend (full 4-tone scale) for explaining the bars' colours. */
export const DIFFICULTY_LEGEND: ReadonlyArray<{ key: string; label: string; color: string }> = [
    { key: "easy", label: "Beginner", color: "var(--success)" },
    { key: "medium", label: "Intermediate", color: "var(--warning)" },
    { key: "hard", label: "Advanced", color: "var(--danger)" },
    { key: "insane", label: "Insane", color: "var(--difficulty-insane)" },
]

/**
 * Resolve a raw challenge difficulty to its {@link Difficulty} chip level.
 * @param raw - the raw difficulty value (or null for V1-legacy).
 * @returns the chip level, or undefined when unknown/absent.
 */
export const difficultyLevel = (raw: string | null | undefined): Difficulty | undefined =>
    raw ? DIFFICULTY_META[raw]?.level : undefined
