"use client"

import useSWR from "swr"

/** A grader lane the learner can pick (mock of StarCI's AI gradable models). */
export interface GraderOption {
    /** Stable key ("auto", "premium-…"). */
    key: string
    /** Human label (e.g. "Auto", "Qwen 2.5 Coder"). */
    label: string
    /** Remaining / total credits, e.g. "250/250 credits". */
    creditsLabel: string
    /** Premium lanes are gated behind enrollment (mirrors canPremium). */
    isPremium?: boolean
}

/** Severity of a single grader finding (drives the dot colour). */
export type FeedbackSeverity = "high" | "medium" | "low"

/** One structured grader finding on an attempt. */
export interface SubmissionFeedback {
    id: string
    severity: FeedbackSeverity
    /** Primary message. */
    message: string
    /** File / code location, shown mono. */
    location?: string
    /** Suggested fix. */
    suggestion?: string
}

/** One graded attempt on a requirement. */
export interface SubmissionAttempt {
    id: string
    /** 1-based attempt ordinal. */
    attemptNumber: number
    /** Earned score, or null while queued. */
    score: number | null
    /** The submitted URL for this attempt. */
    submissionUrl: string
    /** Which model graded it (byline). */
    servedModel: string
    /** ISO timestamp graded. */
    processedAt: string
    /** Structured findings. */
    feedbacks: Array<SubmissionFeedback>
}

/** One graded requirement in a challenge (StarCI: ChallengeSubmissionEntity). */
export interface ChallengeRequirement {
    id: string
    /** 0-based sort index (shown as `sortIndex + 1.`). */
    sortIndex: number
    title: string
    description: string
    /** Max points for this requirement. */
    score: number
    /** Placeholder for the submission URL input. */
    urlPlaceholder: string
    /** The learner's last graded attempt on this requirement, if any. */
    lastAttempt: SubmissionAttempt | null
    /** Full attempt history (newest first), for "View attempts". */
    attempts: Array<SubmissionAttempt>
}

/** The full submission surface (§4, mock until BE lands). */
export interface ChallengeSubmission {
    /** Challenge title (shown in the header). */
    title: string
    /** Fraction of max needed to pass (e.g. 0.8). */
    passThreshold: number
    requirements: Array<ChallengeRequirement>
    graders: Array<GraderOption>
}

const buildRequirements = (challengeId: string): Array<ChallengeRequirement> => [
    {
        id: `${challengeId}-r1`,
        sortIndex: 0,
        title: "GitHub Repository",
        description:
            "Push your solution to a public GitHub repository. The grader clones the repo, runs the test suite and scores correctness, structure and commit hygiene.",
        score: 100,
        urlPlaceholder: "https://github.com/you/your-solution",
        // A prior graded attempt so the "last attempt" result + attempts history render.
        lastAttempt: {
            id: `${challengeId}-r1-a1`,
            attemptNumber: 1,
            score: 78,
            submissionUrl: "https://github.com/you/your-solution",
            servedModel: "Qwen2.5 Coder 32B",
            processedAt: new Date(Date.now() - 1000 * 60 * 42).toISOString(),
            feedbacks: [
                {
                    id: "f1",
                    severity: "high",
                    message: "Missing edge-case handling for empty input.",
                    location: "src/parse.ts:24",
                    suggestion: "Guard against a zero-length array before indexing.",
                },
                {
                    id: "f2",
                    severity: "medium",
                    message: "Test coverage is below the 80% target.",
                    location: "coverage/summary.txt",
                    suggestion: "Add tests for the error branches in `handle()`.",
                },
                {
                    id: "f3",
                    severity: "low",
                    message: "A few commits mix formatting with logic changes.",
                },
            ],
        },
        attempts: [
            {
                id: `${challengeId}-r1-a1`,
                attemptNumber: 1,
                score: 78,
                submissionUrl: "https://github.com/you/your-solution",
                servedModel: "Qwen2.5 Coder 32B",
                processedAt: new Date(Date.now() - 1000 * 60 * 42).toISOString(),
                feedbacks: [
                    {
                        id: "f1",
                        severity: "high",
                        message: "Missing edge-case handling for empty input.",
                        location: "src/parse.ts:24",
                        suggestion: "Guard against a zero-length array before indexing.",
                    },
                ],
            },
        ],
    },
    {
        id: `${challengeId}-r2`,
        sortIndex: 1,
        title: "Design write-up",
        description:
            "Submit a short Google Doc explaining your design decisions and trade-offs. The grader checks that each requirement is addressed and reasoned about.",
        score: 50,
        urlPlaceholder: "https://docs.google.com/document/d/…",
        lastAttempt: null,
        attempts: [],
    },
]

const fetchSubmissionMock = async (_courseId: string, challengeId: string): Promise<ChallengeSubmission> => ({
    title: "Build a small parser",
    passThreshold: 0.8,
    requirements: buildRequirements(challengeId),
    graders: [
        { key: "auto", label: "Auto", creditsLabel: "250/250 credits" },
        { key: "coder-32b", label: "Qwen2.5 Coder 32B", creditsLabel: "120/250 credits", isPremium: true },
        { key: "fast", label: "Fast", creditsLabel: "250/250 credits" },
    ],
})

/** Loads the challenge submission surface. Mocked; SWR-shaped for a BE swap. */
export const useQueryChallengeSubmissionSwr = (courseId: string, challengeId: string) => {
    const { data, isLoading, error, mutate } = useSWR(
        ["challenge-submission", courseId, challengeId],
        () => fetchSubmissionMock(courseId, challengeId),
    )
    return { submission: data, isLoading, error, mutate }
}
