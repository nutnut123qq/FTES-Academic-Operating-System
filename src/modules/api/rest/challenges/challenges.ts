import { restRequest } from "@/modules/api/rest/client"
import type {
    ChallengeView,
    CreateChallengeRequest,
    CreateTeamRequest,
    LeaderboardView,
    ManualScoreItem,
    RubricUpsert,
    SubmissionResultsView,
    SubmissionView,
    SubmitRequest,
    TeamView,
    TestCaseUpsert,
} from "./types"

/**
 * Lists all public challenges.
 *
 * `GET /api/v1/challenges`
 */
export const listChallenges = async (): Promise<Array<ChallengeView>> => {
    return restRequest<Array<ChallengeView>>({
        method: "GET",
        url: "/challenges",
        // BE gates the list behind auth (anon → 401); attach the bearer token.
        authenticated: true,
    })
}

/**
 * Creates a new challenge (requires `challenge.manage`).
 *
 * `POST /api/v1/challenges`
 */
export const createChallenge = async (
    request: CreateChallengeRequest,
): Promise<ChallengeView> => {
    return restRequest<ChallengeView>({
        method: "POST",
        url: "/challenges",
        data: request,
    })
}

/**
 * Publishes a draft challenge (requires `challenge.manage`).
 *
 * `POST /api/v1/challenges/{id}/publish`
 */
export const publishChallenge = async (id: string): Promise<ChallengeView> => {
    return restRequest<ChallengeView>({
        method: "POST",
        url: `/challenges/${id}/publish`,
    })
}

/**
 * Closes a challenge (requires `challenge.manage`).
 *
 * `POST /api/v1/challenges/{id}/close`
 */
export const closeChallenge = async (id: string): Promise<void> => {
    return restRequest<void>({
        method: "POST",
        url: `/challenges/${id}/close`,
    })
}

/**
 * Replaces the test cases of a challenge (requires `challenge.manage`).
 *
 * `PUT /api/v1/challenges/{id}/test-cases`
 */
export const updateChallengeTestCases = async (
    id: string,
    request: TestCaseUpsert,
): Promise<void> => {
    return restRequest<void>({
        method: "PUT",
        url: `/challenges/${id}/test-cases`,
        data: request,
    })
}

/**
 * Replaces the rubrics of a challenge (requires `challenge.manage`).
 *
 * `PUT /api/v1/challenges/{id}/rubrics`
 */
export const updateChallengeRubrics = async (
    id: string,
    request: RubricUpsert,
): Promise<void> => {
    return restRequest<void>({
        method: "PUT",
        url: `/challenges/${id}/rubrics`,
        data: request,
    })
}

/**
 * Returns a single challenge by slug.
 *
 * `GET /api/v1/challenges/{slug}`
 */
export const getChallengeBySlug = async (slug: string): Promise<ChallengeView> => {
    return restRequest<ChallengeView>({
        method: "GET",
        url: `/challenges/${slug}`,
        // BE gates challenge reads behind auth (anon → 401); attach the bearer token.
        authenticated: true,
    })
}

/**
 * Creates a team for a team-mode challenge (requires `challenge.participate`).
 *
 * `POST /api/v1/challenges/{id}/teams`
 */
export const createChallengeTeam = async (
    id: string,
    request: CreateTeamRequest,
): Promise<TeamView> => {
    return restRequest<TeamView>({
        method: "POST",
        url: `/challenges/${id}/teams`,
        data: request,
    })
}

/**
 * Joins an existing team (requires `challenge.participate`).
 *
 * `POST /api/v1/challenges/{id}/teams/{teamId}/join`
 */
export const joinChallengeTeam = async (
    id: string,
    teamId: string,
): Promise<void> => {
    return restRequest<void>({
        method: "POST",
        url: `/challenges/${id}/teams/${teamId}/join`,
    })
}

/**
 * Submits a solution to a challenge (requires `challenge.participate`).
 *
 * `POST /api/v1/challenges/{id}/submissions`
 */
export const submitChallenge = async (
    id: string,
    request: SubmitRequest,
): Promise<SubmissionView> => {
    return restRequest<SubmissionView>({
        method: "POST",
        url: `/challenges/${id}/submissions`,
        data: request,
    })
}

/**
 * Lists the current user's submissions for a challenge
 * (requires `challenge.participate`).
 *
 * `GET /api/v1/challenges/{id}/submissions/me`
 */
export const getMyChallengeSubmissions = async (
    id: string,
): Promise<Array<SubmissionView>> => {
    return restRequest<Array<SubmissionView>>({
        method: "GET",
        url: `/challenges/${id}/submissions/me`,
    })
}

/**
 * Returns the test results for a submission (requires `challenge.participate`).
 *
 * `GET /api/v1/challenges/{id}/submissions/{submissionId}/results`
 */
export const getChallengeSubmissionResults = async (
    id: string,
    submissionId: string,
): Promise<SubmissionResultsView> => {
    return restRequest<SubmissionResultsView>({
        method: "GET",
        url: `/challenges/${id}/submissions/${submissionId}/results`,
    })
}

/**
 * Applies manual rubric scores to a submission (requires `challenge.grade`).
 *
 * `POST /api/v1/challenges/{id}/submissions/{submissionId}/manual-scores`
 */
export const applyChallengeManualScores = async (
    id: string,
    submissionId: string,
    scores: Array<ManualScoreItem>,
): Promise<void> => {
    return restRequest<void>({
        method: "POST",
        url: `/challenges/${id}/submissions/${submissionId}/manual-scores`,
        data: scores,
    })
}

/**
 * Returns the challenge leaderboard.
 *
 * `GET /api/v1/challenges/{id}/leaderboard?limit={limit}`
 */
export const getChallengeLeaderboard = async (
    id: string,
    limit = 20,
): Promise<LeaderboardView> => {
    return restRequest<LeaderboardView>({
        method: "GET",
        url: `/challenges/${id}/leaderboard`,
        params: { limit },
        authenticated: false,
    })
}
