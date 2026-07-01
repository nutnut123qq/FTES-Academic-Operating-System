import type { AbstractEntity } from "./abstract"
import type { CourseEntity } from "./course"
import type { UserEntity } from "./user"
import type { PricingPhase } from "../enums"

/**
 * User enrolled in a course (join table).
 */
export interface EnrollmentEntity extends AbstractEntity {
    /** The user that is enrolled in the course. */
    user?: UserEntity
    /** The course that the user is enrolled in. */
    course?: CourseEntity
    /** The user ID. */
    userId: string
    /** The course ID. */
    courseId: string
    /** The pricing phase that the user enrolled in. */
    pricingPhase?: PricingPhase
    /** User's submitted personal project GitHub URL at enrollment level. */
    personalProjectGithubUrl?: string | null
    /** Git branch for personal project review (null = default in UI, e.g. main). */
    personalProjectGithubBranch?: string | null
    /** User's submitted personal project idea text. */
    ideaText?: string | null
}
