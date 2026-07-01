import type { AbstractEntity } from "./abstract"
import type { AdvancedContentEntity } from "./advanced-content"
import type { ChallengeEntity } from "./challenge"
import type { ContentEntity } from "./content"
import type { CourseEntity } from "./course"
import type { LessonVideoEntity } from "./lesson-video"
import type { GeneralContentEntity } from "./general-content"
import type { PreviewContentEntity } from "./preview-content"
import type { SubmissionEntity } from "./submission"
import type { CourseContentTier } from "../enums/course-content-tier"

/**
 * One module inside a course.
 */
export interface ModuleEntity extends AbstractEntity {
    /** The display id of the module. */
    displayId: string
    /** The title of the module. */
    title: string
    /** The description of the module. */
    description: string | null
    /** Pure ordering index used to sort/reorder (1-based). */
    sortIndex: number
    /** The course that the module belongs to. */
    course?: CourseEntity
    /** The general content of the module. */
    generalContent?: GeneralContentEntity
    /** The advanced content of the module. */
    advancedContent?: AdvancedContentEntity
    /** The contents of the module. */
    contents?: Array<ContentEntity>
    /** Preview bullet/paragraph line items for the module. */
    previewContents?: Array<PreviewContentEntity>
    /** The exclusive lesson videos of the module. */
    exclusiveLessonVideos?: Array<LessonVideoEntity>
    /** The lesson videos of the module. */
    lessonVideos?: Array<LessonVideoEntity>
    /** Hands-on challenges for this module. */
    challenges?: Array<ChallengeEntity>
    /** The submissions of the module. */
    submissions?: Array<SubmissionEntity>
    /** The number of contents in the module. */
    numContents: number
    /** Learning tier (foundation/intermediate/advanced) — drives the badge. */
    contentTier?: CourseContentTier
    /** Hard paywall flag for all contents in the module. */
    isPremium?: boolean
}
