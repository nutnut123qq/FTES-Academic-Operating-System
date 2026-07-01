/**
 * Production stage / quality tier for a module lesson video.
 * Stored in `lesson_videos.kind`.
 */
export enum LessonVideoKind {
    /** Raw livestream recording (unprocessed). */
    RawStream = "rawStream",
    /** Edited livestream (cleaned, cut, structured). */
    EditedStream = "editedStream",
    /** Premium recorded version (high quality, curated). */
    PremiumRecord = "premiumRecord",
}