/**
 * One top-level navigation entry rendered in the desktop navbar.
 */
export interface NavbarItem {
    /** Visible label. */
    label: string
    /** Navigation target path. */
    path: string
    /** Whether this entry matches the active route. */
    isActive: boolean
}
