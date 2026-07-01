/**
 * Per-locale title for a SCHEMA V2 output item (usually null).
 * Mirrors Nest `ChallengeOutputTranslationEntity` / `challenge_output_v2_translations`.
 */
export interface ChallengeOutputTranslationEntity {
    /** Parent output item id (composite PK). */
    challengeOutputId: string
    /** Locale of this title (composite PK). */
    locale: string
    /** Localized output title (usually null). */
    title: string | null
}
