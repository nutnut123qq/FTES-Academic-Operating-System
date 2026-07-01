import type { AbstractEntity } from "./abstract"

/**
 * Localized row for a {@link ChallengeEntity} field (`title`, `brief`, `description`).
 *
 * Mirrors table `challenge_translations`.
 */
export interface ChallengeTranslationEntity extends AbstractEntity {
    /** Owning challenge id. */
    challengeId: string
    /** Locale code (e.g. `vi`, `en`). */
    locale: string
    /** Field name being translated. */
    field: string
    /** Translated value. */
    value: string
}
