import type { AbstractEntity } from "./abstract"

/**
 * Localized row for {@link LivestreamSessionEntity} (e.g. `note`).
 *
 * Mirrors Nest `LivestreamSessionTranslationEntity` / `livestream_session_translations`.
 */
export interface LivestreamSessionTranslationEntity extends AbstractEntity {
    /** Owning livestream session id. */
    livestreamSessionId: string
    /** Locale (Nest `Locale` / GraphQL). */
    locale: string
    /** Field name being translated. */
    field: string
    /** Translated value. */
    value: string
}
