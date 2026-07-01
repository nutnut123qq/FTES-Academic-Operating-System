/** A template CV the user can pick as a starting point for their own submission. */
export interface TemplateCVEntity {
    /** Unique identifier of the template CV. */
    id: string
    /** Display title of the template. */
    title: string
    /** Optional description of the template. */
    description?: string | null
}
