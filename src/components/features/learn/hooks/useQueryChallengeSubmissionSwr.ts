"use client"

import useSWR from "swr"
import {
    getChallengeBySlug,
    getMyChallengeSubmissions,
    type ChallengeView,
    type SubmissionView,
} from "@/modules/api/rest/challenges"

/** Submission statuses that are still being graded (auto-grade / ftes-ai-service). */
const PENDING_STATUSES = new Set(["PENDING", "QUEUED", "GRADING"])

/** True while a submission has not reached a terminal (COMPLETED/FAILED) status. */
export const isChallengeSubmissionPending = (submission: SubmissionView): boolean =>
    PENDING_STATUSES.has(submission.status)

/** The real challenge-submission surface: the linked challenge + the learner's attempts. */
export interface ChallengeSubmissionData {
    /** The challenge being solved (title / type / mcqQuestions / maxSubmissions). */
    challenge: ChallengeView
    /** The learner's submissions on this challenge (any order; component sorts). */
    submissions: Array<SubmissionView>
}

/**
 * Loads the real challenge-submission surface from REST: the linked challenge
 * (`getChallengeBySlug` — BE falls back to by-id when the slug is a UUID) joined
 * with the learner's own submissions (`getMyChallengeSubmissions`).
 *
 * Grading lands asynchronously (auto-grade / ftes-ai-service), so while ANY
 * submission is still pending the query self-polls every 5s and stops once every
 * submission is terminal — the finalScore appears without a reload.
 *
 * A `CHALLENGE_COURSE_ACCESS_DENIED` (403 — course-bank challenge, not enrolled)
 * on the detail read surfaces as `error` so the caller can render an enroll CTA;
 * `shouldRetryOnError:false` keeps that 403 from looping.
 */
export const useQueryChallengeSubmissionSwr = (challengeId: string) => {
    const { data, isLoading, error, mutate } = useSWR<ChallengeSubmissionData, Error>(
        challengeId ? ["CHALLENGE_SUBMISSION", challengeId] : null,
        async (): Promise<ChallengeSubmissionData> => {
            const challenge = await getChallengeBySlug(challengeId)
            // The attempts list requires `challenge.participate`; an anon/empty read
            // should not blank the whole surface — tolerate it as no attempts yet.
            const submissions = await getMyChallengeSubmissions(challenge.id).catch(
                (): Array<SubmissionView> => [],
            )
            return { challenge, submissions }
        },
        {
            // Poll only while something is still being graded; 0 = no polling.
            refreshInterval: (latest?: ChallengeSubmissionData) =>
                latest?.submissions.some(isChallengeSubmissionPending) ? 5000 : 0,
            shouldRetryOnError: false,
        },
    )

    return {
        challenge: data?.challenge,
        submissions: data?.submissions ?? [],
        isLoading,
        error,
        mutate,
    }
}
