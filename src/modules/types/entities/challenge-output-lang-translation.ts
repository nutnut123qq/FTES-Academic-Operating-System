/**
 * Per-locale `text` override for a SCHEMA V2 output language row.
 * Mirrors Nest `ChallengeOutputLangTranslationEntity` / `challenge_output_v2_lang_translations`.
 */
export interface ChallengeOutputLangTranslationEntity {
    /** Parent output language row id (composite PK). */
    challengeOutputLangId: string
    /** Locale of this translation (composite PK). */
    locale: string
    /** Target field name being translated (composite PK). */
    field: string
    /** Translated value for the field. */
    value: string
}
