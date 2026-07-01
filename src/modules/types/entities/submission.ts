import type { AbstractEntity } from "./abstract"
import type { ModuleEntity } from "./module"
import type { ResourceEntity } from "./resource"
import type { UserEntity } from "./user"

/**
 * Learner submission for a module (owns resources).
 */
export interface SubmissionEntity extends AbstractEntity {
    /** The user that the submission belongs to. */
    user?: UserEntity
    /** The module that the submission belongs to. */
    module?: ModuleEntity
    /** The resources of the submission. */
    resources?: Array<ResourceEntity>
}
