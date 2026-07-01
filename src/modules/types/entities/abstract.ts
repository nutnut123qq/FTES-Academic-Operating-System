/**
 * Common interface for all entities.
 */
export interface AbstractEntity {
    /** The unique identifier for the entity. */
    id: string
    /** The timestamp when the entity was created. */
    createdAt: Date
    /** The timestamp when the entity was last updated. */
    updatedAt: Date
}
