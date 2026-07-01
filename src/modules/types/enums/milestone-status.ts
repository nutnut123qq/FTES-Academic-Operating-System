/**
 * Lifecycle status of a user milestone attempt (matches backend `MilestoneStatus`).
 */
export enum MilestoneStatus {
    /** Milestone has not been started by the learner. */
    Pending = "pending",
    /** Milestone is currently under AI or instructor review. */
    InReview = "inReview",
    /** Milestone review passed; learner may proceed. */
    Passed = "passed",
    /** Milestone review failed; learner must revise and resubmit. */
    Failed = "failed",
}
