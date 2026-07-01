/**
 * Submission requirement kind (GraphQL `GraphQLTypeSubmissionType` / DB `submission_type`).
 * Mirrors `ref/challenge-submission.entity.ts` (`SubmissionType`).
 */
export enum SubmissionType {
    /** Learner submits a Google Docs URL for review. */
    GoogleDocsUrl = "googleDocsUrl",
    /** Learner submits a GitHub repository URL for review. */
    GithubUrl = "githubUrl",
}
