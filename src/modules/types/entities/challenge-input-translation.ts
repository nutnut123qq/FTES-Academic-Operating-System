import type { AbstractEntity } from "./abstract"

/**
 * Localized row for a {@link ChallengeInputEntity} field (e.g. `description`).
 *
 * Mirrors table `challenge_input_translations`.
 */
export interface ChallengeInputTranslationEntity extends AbstractEntity {
    /** Owning challenge input id. */
    challengeInputId: string
    /** Locale code (e.g. `vi`, `en`). */
    locale: string
    /** Field name being translated. */
    field: string
    /** Translated value. */
    value: string
}
