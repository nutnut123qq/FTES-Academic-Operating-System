import type { AbstractEntity } from "./abstract"
import type { CourseEntity } from "./course"

/**
 * One prerequisite line on a course landing page.
 */
export interface PrerequisiteEntity extends AbstractEntity {
    /** The text of the prerequisite. */
    text: string
    /** Pure ordering index used to sort/reorder (1-based). */
    sortIndex: number
    /** The course that the prerequisite belongs to. */
    course?: CourseEntity
}
