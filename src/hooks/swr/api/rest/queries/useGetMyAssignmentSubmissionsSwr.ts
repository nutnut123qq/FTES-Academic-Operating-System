"use client"

import useSWR from "swr"
import {
    getMyAssignmentSubmissions,
    type CourseSubmissionView,
} from "@/modules/api/rest/course"

/** Submission statuses that are still being graded by the ftes-ai-service lane. */
const PENDING_STATUSES = new Set(["SUBMITTED", "GRADING"])

/** True while a submission has not reached a terminal (GRADED/FAILED) status. */
export const isSubmissionPending = (submission: CourseSubmissionView): boolean =>
    PENDING_STATUSES.has(submission.status)

/**
 * SWR query wrapper for {@link getMyAssignmentSubmissions}. Gated on `assignmentId`.
 *
 * The AI grade lands asynchronously (ftes-ai-service → BE), so while ANY submission
 * is still `SUBMITTED`/`GRADING` the query self-polls every few seconds and stops
 * once every submission is terminal — no page reload needed for the score to appear.
 */
export const useGetMyAssignmentSubmissionsSwr = (assignmentId: string) => {
    const swr = useSWR<Array<CourseSubmissionView>, Error>(
        assignmentId ? ["ASSIGNMENT_SUBMISSIONS_SWR", assignmentId] : null,
        () => {
            if (!assignmentId) {
                throw new Error("assignmentId is required")
            }
            return getMyAssignmentSubmissions(assignmentId)
        },
        {
            // Poll only while something is still being graded; 0 = no polling.
            refreshInterval: (latest?: Array<CourseSubmissionView>) =>
                latest?.some(isSubmissionPending) ? 5000 : 0,
        },
    )

    return swr
}
