/** One breadcrumb row rendered in a foundations page header. */
export interface FoundationsBreadcrumbItem {
    /** Stable React key. */
    key: string
    /** Visible label. */
    label: string
    /** Optional navigation handler fired on press. */
    onPress?: () => void
}
