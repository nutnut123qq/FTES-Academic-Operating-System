import type { AbstractEntity } from "./abstract"
import type { ChallengeRequirementLangEntity } from "./challenge-requirement-lang"

/**
 * SCHEMA V2 requirement item (one row per position).
 * Mirrors Nest `ChallengeRequirementEntity` / `challenge_requirements_v2`.
 * Title/body live on each {@link ChallengeRequirementLangEntity} row.
 */
export interface ChallengeRequirementEntity extends AbstractEntity {
    /** Pure ordering index used to sort/reorder (1-based). */
    sortIndex: number
    /** Default locale for this requirement item. */
    defaultLocale: string
    /** Per-programming-language score + title + body rows. */
    langs?: Array<ChallengeRequirementLangEntity>
}
