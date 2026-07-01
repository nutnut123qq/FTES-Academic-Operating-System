import type { AbstractEntity } from "./abstract"
import type { ChallengeStepLangEntity } from "./challenge-step-lang"

/**
 * SCHEMA V2 step item (one row per position).
 * Mirrors Nest `ChallengeStepEntity` / `challenge_steps_v2`.
 * Title/body live on each {@link ChallengeStepLangEntity} row.
 */
export interface ChallengeStepEntity extends AbstractEntity {
    /** Pure ordering index used to sort/reorder (1-based). */
    sortIndex: number
    /** Default locale for this step item. */
    defaultLocale: string
    /** Per-programming-language title + body rows. */
    langs?: Array<ChallengeStepLangEntity>
}
