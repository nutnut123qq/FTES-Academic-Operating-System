import type { AbstractEntity } from "./abstract"
import type { CourseEntity } from "./course"

/**
 * FAQ entry for a course.
 */
export interface QnaEntity extends AbstractEntity {
    /** The question of the Q&A entry. */
    question: string
    /** The answer of the Q&A entry. */
    answer: string
    /** Pure ordering index used to sort/reorder (1-based). */
    sortIndex: number
    /** The course that the Q&A entry belongs to. */
    course?: CourseEntity
}
