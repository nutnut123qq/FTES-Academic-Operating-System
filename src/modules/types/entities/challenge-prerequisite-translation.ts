/**
 * Per-locale title for a SCHEMA V2 prerequisite item (usually null).
 * Mirrors Nest `ChallengePrerequisiteTranslationEntity` / `challenge_prerequisite_v2_translations`.
 */
export interface ChallengePrerequisiteTranslationEntity {
    /** Parent prerequisite item id (composite PK). */
    challengePrerequisiteId: string
    /** Locale of this title (composite PK). */
    locale: string
    /** Localized prerequisite title (usually null). */
    title: string | null
}
