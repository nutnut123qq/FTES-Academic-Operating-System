/**
 * Per-locale `text` override for a SCHEMA V2 prerequisite language row.
 * Mirrors Nest `ChallengePrerequisiteLangTranslationEntity` / `challenge_prerequisite_v2_lang_translations`.
 */
export interface ChallengePrerequisiteLangTranslationEntity {
    /** Parent prerequisite language row id (composite PK). */
    challengePrerequisiteLangId: string
    /** Locale of this translation (composite PK). */
    locale: string
    /** Target field name being translated (composite PK). */
    field: string
    /** Translated value for the field. */
    value: string
}
