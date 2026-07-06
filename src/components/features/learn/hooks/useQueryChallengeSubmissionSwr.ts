"use client"

import useSWR from "swr"

/** One grader lane the learner can pick. */
export interface GraderOption {
    /** Stable key ("auto", "gpt4", …). */
    key: string
    /** Human label. */
    label: string
    /** Remaining / total credits, e.g. "250/250 credits". */
    creditsLabel: string
}

/** A single graded task in the challenge. */
export interface ChallengeTask {
    id: string
    /** 1-based ordinal shown in the heading. */
    order: number
    title: string
    description: string
    /** Max points for the task. */
    points: number
    /** Placeholder for the submission URL input. */
    urlPlaceholder: string
}

/** The learner's last graded result for the task. */
export interface SubmissionResult {
    /** Score awarded out of `total`. */
    score: number
    total: number
    /** Short grader feedback. */
    feedback: string
    /** Number of prior attempts. */
    attempts: number
}

/** The full submission surface (§4, mock until BE lands). */
export interface ChallengeSubmission {
    task: ChallengeTask
    graders: Array<GraderOption>
    /** Last result, or null if never submitted. */
    result: SubmissionResult | null
}

const fetchSubmissionMock = async (_courseId: string, challengeId: string): Promise<ChallengeSubmission> => ({
    task: {
        id: `${challengeId}-t1`,
        order: 1,
        title: "GitHub Repository",
        description:
            "Push your solution to a public GitHub repository. The grader clones the repo, runs the test suite and scores correctness, structure and commit hygiene.",
        points: 100,
        urlPlaceholder: "https://github.com/you/your-solution",
    },
    graders: [
        { key: "auto", label: "Auto", creditsLabel: "250/250 credits" },
        { key: "thorough", label: "Thorough", creditsLabel: "120/250 credits" },
        { key: "fast", label: "Fast", creditsLabel: "250/250 credits" },
    ],
    // ponytail: null → the "Your result" section shows the empty prompt.
    result: null,
})

/** Loads the challenge submission surface. Mocked; SWR-shaped for a BE swap. */
export const useQueryChallengeSubmissionSwr = (courseId: string, challengeId: string) => {
    const { data, isLoading, error, mutate } = useSWR(
        ["challenge-submission", courseId, challengeId],
        () => fetchSubmissionMock(courseId, challengeId),
    )
    return { submission: data, isLoading, error, mutate }
}
