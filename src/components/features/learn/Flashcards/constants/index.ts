/** One SM-2 recall grade option: its grade value and the i18n key for its label. */
export interface Sm2GradeConfig {
    /** SM-2 grade reported to `reviewFlashcard` (0=Again, 1=Hard, 2=Good, 3=Easy). */
    grade: number
    /** i18n key (under `flashcard.review`) for the button label. */
    labelKey: string
}

/** Max cards pulled into one due-review batch (mirrors the backend default). */
export const DUE_REVIEW_LIMIT = 20

/**
 * The four SM-2 recall grades, weakest recall first. Features map these to a
 * {@link import("@/components/blocks").RatingBar} (resolving `labelKey` via `t`).
 */
export const SM2_GRADES: ReadonlyArray<Sm2GradeConfig> = [
    { grade: 0, labelKey: "flashcard.review.again" },
    { grade: 1, labelKey: "flashcard.review.hard" },
    { grade: 2, labelKey: "flashcard.review.good" },
    { grade: 3, labelKey: "flashcard.review.easy" },
]
