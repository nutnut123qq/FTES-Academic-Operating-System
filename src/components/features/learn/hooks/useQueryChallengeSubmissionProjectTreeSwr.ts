"use client"

import useSWR from "swr"
import {
    getSubmissionProjectTree,
    type ProjectTreeEntry,
} from "@/modules/api/rest/challenges"

/**
 * Loads the file tree of a graded PROJECT submission (`getSubmissionProjectTree`) so the
 * VS Code-style review ({@link ProjectReviewResult}) can render every file node coloured
 * green (clean) / orange (has a flagged change) before any file is opened.
 *
 * Lazily gated: the key stays `null` (no request) until {@link enabled} — the caller flips
 * it when the learner expands "Xem kết quả" on a project attempt, so the tree only loads
 * for the submission actually opened. `shouldRetryOnError:false` keeps a failed read (e.g.
 * a 403 on a non-owner, or a github-URL grade with no served zip) from looping; the
 * UI-local hook does not dispatch to Redux.
 *
 * @param challengeId - The real challenge UUID the submission belongs to.
 * @param submissionId - The graded project submission whose tree to load.
 * @param enabled - Fetch only while true (the row is expanded and it is a project).
 */
export const useQueryChallengeSubmissionProjectTreeSwr = (
    challengeId: string,
    submissionId: string,
    enabled: boolean,
) => {
    return useSWR<Array<ProjectTreeEntry>, Error>(
        enabled && challengeId && submissionId
            ? ["CHALLENGE_SUBMISSION_PROJECT_TREE", challengeId, submissionId]
            : null,
        () => getSubmissionProjectTree(challengeId, submissionId),
        { shouldRetryOnError: false },
    )
}
