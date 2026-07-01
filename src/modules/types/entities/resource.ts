import type { ResourceType } from "../enums"
import type { AbstractEntity } from "./abstract"
import type { SubmissionEntity } from "./submission"

/**
 * Single payload inside a submission (folders or git URL).
 */
export interface ResourceEntity extends AbstractEntity {
    /** The type of the resource. */
    type: ResourceType
    /** The folders of the resource. */
    foldersJson: Array<string> | null
    /** The Git URL of the resource. */
    gitUrl: string | null
    /** The submission that the resource belongs to. */
    submission?: SubmissionEntity
}
