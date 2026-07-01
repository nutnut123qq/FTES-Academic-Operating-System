/**
 * UI-facing job categories for realtime status rendering (aligns with backend `JobCategory`).
 */
export enum JobCategory {
    /** AI grading job triggered when a learner submits a challenge. */
    SubmitChallenge = "submitChallenge",
    /** AI review job triggered when a CV is uploaded for analysis. */
    ReviewCv = "reviewCv",
    /** AI review job triggered when a personal project task is submitted. */
    ReviewTask = "reviewTask",
    /** Judge0 grading job triggered when a coding-practice solution is submitted. */
    JudgeCoding = "judgeCoding",
}
