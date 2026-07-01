import type { AbstractEntity } from "./abstract"
import type { LessonVideoKind, LessonVideoType, VideoHostPlatform } from "../enums"
import type { LessonVideoTranslationEntity } from "./lesson-video-translation"
import type { ModuleEntity } from "./module"

/**
 * Video link and metadata attached to a module.
 *
 * Mirrors Nest `LessonVideoEntity` / table `lesson_videos`.
 */
export interface LessonVideoEntity extends AbstractEntity {
    /** Human-facing stable id from the lesson-video mount folder (`{index}-{slug}` slug segment). */
    displayId: string
    /** The title of the lesson video. */
    title: string
    /** Optional video description. */
    description: string | null
    /** Production type (raw stream, edited, premium recording). */
    kind: LessonVideoKind
    /** Video delivery format (standard mp4 or MPEG-DASH). */
    videoType: LessonVideoType
    /** Video container format string (e.g. "mp4", "mpd"). */
    format: string | null
    /** Optional short caption or note (default locale column; localized via translations). */
    caption: string | null
    /** Host or delivery platform for {@link LessonVideoEntity.url}. */
    hostPlatform: VideoHostPlatform
    /** Video URL (e.g. YouTube watch or embed link). */
    url: string
    /** Optional thumbnail image URL. */
    thumbnailUrl?: string
    /** Video duration in milliseconds. */
    durationMs: number
    /** Pure ordering index used to sort/reorder (1-based). */
    sortIndex: number
    /** Default locale for this row (Nest `Locale` / GraphQL `GraphQLTypeLocale`). */
    defaultLocale: string
    /** Parent module. */
    module?: ModuleEntity
    /**
     * Nullable pricing phase id gating access (Nest column `pricing_phase_id`).
     * GraphQL property name on the API may be `moduleId` (backend entity quirk).
     */
    moduleId?: string | null
    /** Localized overrides (e.g. title, description, caption). */
    translations?: Array<LessonVideoTranslationEntity>
}
