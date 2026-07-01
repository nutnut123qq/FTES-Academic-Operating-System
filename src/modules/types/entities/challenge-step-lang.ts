import type { AbstractEntity } from "./abstract"

/**
 * Per-programming-language row of a SCHEMA V2 step item.
 * Mirrors Nest `ChallengeStepLangEntity` / `challenge_step_v2_langs`.
 * CDN payload exposes resolved `body` per request locale (no nested `translations`).
 */
export interface ChallengeStepLangEntity extends AbstractEntity {
    /** Programming language for this step content. */
    lang: string
    /** Pure ordering index used to sort/reorder (1-based). */
    sortIndex: number
    /** Default locale for this language row. */
    defaultLocale: string
    /** Localized body for the active request locale. */
    body?: string
    /** Localized title for the active request locale (lang-bucket inner rows). */
    title?: string
}
