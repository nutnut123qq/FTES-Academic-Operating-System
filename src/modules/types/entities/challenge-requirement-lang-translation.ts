/**
 * Per-locale body for a SCHEMA V2 requirement language row.
 * Mirrors Nest `ChallengeRequirementLangTranslationEntity` / `challenge_requirement_v2_lang_translations`.
 */
export interface ChallengeRequirementLangTranslationEntity {
    /** Parent requirement language row id (composite PK). */
    challengeRequirementLangId: string
    /** Locale of this body (composite PK). */
    locale: string
    /** Localized requirement body markdown. */
    body: string | null
}
