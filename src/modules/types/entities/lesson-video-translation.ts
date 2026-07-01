/**
 * Localized row for {@link LessonVideoEntity} fields (`title`, `description`, `caption`, etc.).
 *
 * Mirrors Nest `LessonVideoTranslationEntity` / table `lesson_video_translations`.
 */
export interface LessonVideoTranslationEntity {
    /** Owning lesson video id. */
    lessonVideoId: string
    /** Locale (Nest `Locale` / GraphQL `GraphQLTypeLocale`). */
    locale: string
    /** Field name being translated. */
    field: string
    /** Translated value. */
    value: string
    /** Audit timestamp — when this translation row was created. */
    createdAt?: Date
    /** Audit timestamp — when this translation row was last updated. */
    updatedAt?: Date
}
