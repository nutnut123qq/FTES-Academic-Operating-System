import type { AbstractEntity } from "./abstract"
import type { ChallengePrerequisiteLangEntity } from "./challenge-prerequisite-lang"

/**
 * SCHEMA V2 prerequisite item (one row per position).
 * Mirrors Nest `ChallengePrerequisiteEntity` / `challenge_prerequisites_v2`.
 * CDN payload has no item-level title; only per-lang `text` rows.
 */
export interface ChallengePrerequisiteEntity extends AbstractEntity {
    /** Pure ordering index used to sort/reorder (1-based). */
    sortIndex: number
    /** Default locale for this prerequisite item. */
    defaultLocale: string
    /** Per-programming-language text rows. */
    langs?: Array<ChallengePrerequisiteLangEntity>
}
