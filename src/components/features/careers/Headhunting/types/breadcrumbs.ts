/** One breadcrumb row in a headhunting page trail. */
export interface HeadhuntingBreadcrumbItem {
    /** Stable React key. */
    key: string
    /** Visible label. */
    label: string
    /** Optional navigation handler. */
    onPress?: () => void
}
