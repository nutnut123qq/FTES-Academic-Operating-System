import type { AbstractEntity } from "./abstract"
import type { DayOfWeek } from "../enums"
import type { LivestreamSessionTranslationEntity } from "./livestream-session-translation"

/**
 * Minimal course fields returned with a livestream session list item.
 */
export interface LivestreamSessionCourseRef {
    /** Course entity id. */
    id: string
    /** Present when API loads `course` relation (Nest `defaultLocale`). */
    defaultLocale?: string
}

/**
 * Recurring weekly livestream slot for a course (calendar template).
 *
 * Mirrors Nest `LivestreamSessionEntity` / `livestream_sessions`.
 */
export interface LivestreamSessionEntity extends AbstractEntity {
    /** Parent course id (`RelationId` / GraphQL). */
    courseId: string
    /** Day of the week this slot recurs on. */
    dayOfWeek: DayOfWeek
    /** Wall-clock start time (`HH:mm:ss`). */
    startTime: string
    /** Wall-clock expected end time (`HH:mm:ss`). */
    expectedEndTime: string
    /** Optional note or annotation for this slot. */
    note: string | null
    /**
     * When true, UI may hide this row (superseded / overridable slot); backend may still return it.
     */
    isOverridable?: boolean
    /** Pure ordering index used to sort/reorder (1-based). */
    sortIndex: number
    /** Minimal parent course reference when loaded. */
    course?: LivestreamSessionCourseRef
    /** Localized overrides (e.g. `note` field). */
    translations?: Array<LivestreamSessionTranslationEntity>
}
