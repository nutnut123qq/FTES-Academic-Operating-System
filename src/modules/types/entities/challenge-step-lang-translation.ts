/**
 * Per-locale body for a SCHEMA V2 step language row.
 * Mirrors Nest `ChallengeStepLangTranslationEntity` / `challenge_step_v2_lang_translations`.
 */
export interface ChallengeStepLangTranslationEntity {
    /** Parent step language row id (composite PK). */
    challengeStepLangId: string
    /** Locale of this body (composite PK). */
    locale: string
    /** Localized step body markdown. */
    body: string | null
}
