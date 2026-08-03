"use client"

import useSWR from "swr"
import {
    getSubmissionProjectFile,
    type ProjectFileView,
} from "@/modules/api/rest/challenges"

/**
 * Loads the content of ONE file of a graded PROJECT submission
 * (`getSubmissionProjectFile`) so the VS Code-style review ({@link ProjectReviewResult})
 * can render it with line numbers + shiki highlight + inline review comments when the
 * learner clicks a file node.
 *
 * The `path` is part of the SWR key so switching files fetches (and caches) each file
 * independently; the key stays `null` until a file is selected AND {@link enabled}.
 * `keepPreviousData:false` avoids showing the prior file's body while the next loads;
 * `shouldRetryOnError:false` stops a failed read (e.g. a whitelist reject) from looping.
 *
 * @param challengeId - The real challenge UUID the submission belongs to.
 * @param submissionId - The graded project submission the file lives in.
 * @param path - The project-relative file path to load; empty → no request.
 * @param enabled - Fetch only while true (the review is open on a project attempt).
 */
export const useQueryChallengeSubmissionProjectFileSwr = (
    challengeId: string,
    submissionId: string,
    path: string,
    enabled: boolean,
) => {
    return useSWR<ProjectFileView, Error>(
        enabled && challengeId && submissionId && path
            ? ["CHALLENGE_SUBMISSION_PROJECT_FILE", challengeId, submissionId, path]
            : null,
        () => getSubmissionProjectFile(challengeId, submissionId, path),
        { shouldRetryOnError: false, keepPreviousData: false },
    )
}
