import type { AbstractEntity } from "./abstract"
import type { ChallengeStepEntity } from "./challenge-step"
import type { ChallengeTranslationEntity } from "./challenge-translation"
import type { ChallengeOutputEntity } from "./challenge-output"
import type { ChallengeRequirementEntity } from "./challenge-requirement"
import type { ChallengePrerequisiteEntity } from "./challenge-prerequisite"
import type { ChallengeDifficulty } from "../enums/challenge-difficulty"
import type { ModuleEntity } from "./module"

/**
 * Hands-on challenge attached to a module (title, brief, description, guided steps, ordered inputs).
 * Criteria-based per-language schema (requirements/steps/outputs/prerequisites carry `langs`).
 */
export interface ChallengeEntity extends AbstractEntity {
    /** Challenge title. */
    title: string
    /** Full instructions (e.g. markdown). */
    description: string
    /** Points / score when completed. */
    score: number
    /** Relative difficulty. */
    difficulty: ChallengeDifficulty
    /** Optional hint text (markdown) — when present the card shows a "có gợi ý" tag. */
    hint?: string | null
    /** Optional card thumbnail. */
    thumbnailUrl: string | null
    /** Pure ordering index used to sort/reorder (1-based). */
    sortIndex: number
    /** Default locale for this row. */
    defaultLocale: string
    /** Parent module when nested in a graph. */
    module?: ModuleEntity
    /** Localized overrides for title, brief, description. */
    translations?: Array<ChallengeTranslationEntity>
    /** Day this challenge was verified/audited. */
    verified?: string | null
    /** Requirement items (per-language `langs`). */
    requirements?: Array<ChallengeRequirementEntity>
    /** Step items (per-language `langs`). */
    steps?: Array<ChallengeStepEntity>
    /** Output items (per-language `langs`). */
    outputs?: Array<ChallengeOutputEntity>
    /** Prerequisite items (per-language `langs`). */
    prerequisites?: Array<ChallengePrerequisiteEntity>
}
