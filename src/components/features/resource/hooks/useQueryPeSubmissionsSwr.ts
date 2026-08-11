"use client"

import useSWR from "swr"

import {
    getMyPeSubmissions,
    type PeSubmissionListView,
    type PeSubmissionView,
} from "@/modules/api/rest/resource"

/** SWR key for the viewer's PE attempts on one paper (shared with the submit mutation). */
export const peSubmissionsSwrKey = (resourceId: string) =>
    ["PE_SUBMISSIONS_ME_SWR", resourceId] as const

/** How often the attempts list is re-read while an attempt is still being graded. */
export const PE_GRADING_POLL_MS = 5_000

/** Attempt states that mean the grader has not answered yet. */
const IN_FLIGHT_STATUSES = new Set<PeSubmissionView["status"]>(["PENDING", "GRADING"])

/**
 * Whether any attempt in the list is still waiting on the grader — the condition that
 * turns polling on. Exported so the poll rule is testable without React.
 *
 * @param list - The attempts payload, or `undefined` before the first load.
 * @returns `true` when at least one attempt is `PENDING` or `GRADING`.
 */
export const hasPeGradingInFlight = (list: PeSubmissionListView | undefined): boolean =>
    (list?.items ?? []).some((submission) => IN_FLIGHT_STATUSES.has(submission.status))

/**
 * Loads the viewer's own PE attempts plus the server-computed attempt budget
 * (`GET /api/v1/resources/{id}/pe-submissions/me`).
 *
 * Grading is asynchronous — the submit answers `GRADING` and the score lands later — so
 * this is one of the few genuine polling reads in the app: while any attempt is
 * `PENDING`/`GRADING` the hook re-reads every {@link PE_GRADING_POLL_MS}, and stops the
 * moment every attempt has settled.
 *
 * @param resourceId - The PE resource whose attempts to load; `""` gates the fetch off.
 * @returns The raw SWR handle over {@link PeSubmissionListView}.
 */
export const useQueryPeSubmissionsSwr = (resourceId: string) => {
    return useSWR<PeSubmissionListView, Error>(
        resourceId ? peSubmissionsSwrKey(resourceId) : null,
        () => getMyPeSubmissions(resourceId),
        {
            refreshInterval: (latest) =>
                hasPeGradingInFlight(latest) ? PE_GRADING_POLL_MS : 0,
        },
    )
}
