/** A single CV submission attempt mapped into display-ready row data. */
export interface AttemptRow {
    /** Table row key. */
    key: string
    /** Attempt version number from API. */
    attemptNumber: number
    /** Display file label. */
    fileLabel: string
    /** URL to open the CV file. */
    fileUrl: string
    /** Whether `fileUrl` can be opened in a new tab. */
    fileUrlIsPublic: boolean
    /** Formatted submitted time. */
    submittedAtLabel: string
    /** Raw processing status from API. */
    status: string
    /** Truncated feedback preview. */
    feedbackPreview: string
    /** Full feedback markdown for details modal. */
    detailFeedback: string
}
