import type { AbstractEntity } from "./abstract"
import type { AdvancedContentEntity } from "./advanced-content"
import type { CourseEntity } from "./course"
import type { GeneralContentEntity } from "./general-content"

/**
 * Bundles general and advanced premium content items for a course.
 */
export interface PremiumContentEntity extends AbstractEntity {
    /** The course that the premium content belongs to. */
    course?: CourseEntity
    /** The general content of the premium content. */
    generalContent?: Array<GeneralContentEntity>
    /** The advanced content of the premium content. */
    advancedContent?: Array<AdvancedContentEntity>
}
