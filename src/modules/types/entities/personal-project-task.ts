import type { AbstractEntity } from "./abstract"

/**
 * A criterion for evaluating a personal project task.
 */
export interface PersonalProjectTaskCriterionEntity extends AbstractEntity {
    /** The criterion text. */
    text: string
    /** Pure ordering index used to sort/reorder (1-based). */
    sortIndex: number
}

/**
 * A personal project task entity.
 */
export interface PersonalProjectTaskEntity extends AbstractEntity {
    /** The title of the task. */
    title: string
    /** The description of the task. */
    description: string
    /** The task type (e.g. feature, bugfix, refactor, etc.). */
    type: string
    /** The weight / priority of the task. */
    weight: number
    /** Pure ordering index used to sort/reorder (1-based). */
    sortIndex: number
    /** The evaluation criteria for this task. */
    criteria: Array<PersonalProjectTaskCriterionEntity>
}
