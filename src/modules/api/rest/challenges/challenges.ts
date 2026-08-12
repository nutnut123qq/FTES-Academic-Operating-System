import { restRequest } from "@/modules/api/rest/client"
import type {
    ChallengeView,
    CreateChallengeRequest,
    CreateTeamRequest,
    LeaderboardView,
    ManualScoreItem,
    ProjectFileView,
    ProjectTreeEntry,
    RubricUpsert,
    SubmissionResultsView,
    SubmissionView,
    SubmitRequest,
    TeamView,
    TestCaseUpsert,
} from "./types"

/**
 * Normalizes a raw BE submission status onto the FE vocabulary the challenge surfaces
 * poll + render against. The BE lifecycle is `PENDING → RUNNING → SCORED` (or `FAILED`);
 * the FE speaks `PENDING / GRADING / COMPLETED / FAILED`, so `useQueryChallengeSubmissionSwr`
 * keeps polling while `GRADING` and stops (showing "Đã chấm" + the score) at `COMPLETED`.
 * Only the two divergent states are remapped — `PENDING` / `FAILED` / any unknown value
 * passes through unchanged. This is the SINGLE FE-side status remap (PINNED §3): the BE stays
 * on its own vocabulary.
 */
const normalizeSubmissionStatus = (status: string): string => {
    switch (status) {
    case "SCORED":
        return "COMPLETED"
    case "RUNNING":
        return "GRADING"
    default:
        return status
    }
}

/** Applies {@link normalizeSubmissionStatus} to a parsed submission view. */
const normalizeSubmissionView = (view: SubmissionView): SubmissionView => ({
    ...view,
    status: normalizeSubmissionStatus(view.status),
})

/** Optional narrowing of {@link listChallenges}. */
export interface ListChallengesParams {
    /**
     * Owning subject UUID — the BE filters `challenges.subject_id` server-side. Omit for
     * the global bank.
     */
    subjectId?: string
    /**
     * Tag slugs the challenge must carry, **AND** semantics (a row must have every slug).
     * Sent comma-separated (`tags=pe,prf192`), the form the BE documents alongside the
     * repeated-param form. Omit / empty → no tag constraint.
     */
    tags?: Array<string>
}

/**
 * Lists the public challenges, optionally narrowed to one subject and/or a set of tags.
 *
 * `GET /api/v1/challenges?subjectId=&tags=`
 *
 * Both query params are server-side filters (contract challenge-global-bank-tags); an
 * older deployment that does not know them simply ignores them and answers the global
 * bank, so callers must stay correct — not just lucky — if a param is dropped.
 *
 * @param params - {@link ListChallengesParams}; omit for the whole public bank.
 * @returns The matching challenge views.
 */
export const listChallenges = async (
    params?: ListChallengesParams,
): Promise<Array<ChallengeView>> => {
    const tags = params?.tags?.filter((tag) => tag.length > 0) ?? []
    return restRequest<Array<ChallengeView>>({
        method: "GET",
        url: "/challenges",
        params: {
            ...(params?.subjectId ? { subjectId: params.subjectId } : {}),
            ...(tags.length > 0 ? { tags: tags.join(",") } : {}),
        },
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
    const view = await restRequest<SubmissionView>({
        method: "POST",
        url: `/challenges/${id}/submissions`,
        data: request,
    })
    return normalizeSubmissionView(view)
}

/**
 * Submits a solution FILE (code / zip → AI graded) to a challenge, the file-upload
 * counterpart of the JSON {@link submitChallenge} (contract
 * challenge-submission-method-solver, mirroring the assignment `submitAssignmentFile`
 * multipart flow).
 *
 * `Content-Type: null` lets the browser set the multipart boundary (same trick as
 * `submitAssignmentFile` / `uploadAvatar`); the file part is named `file`, with an
 * optional `model` form part carrying the picked AI grading model.
 *
 * FE ASSUMPTION (BE lane owns the real route): multipart `POST` to
 * `/api/v1/challenges/{id}/submissions/file`, returning the same {@link SubmissionView}
 * as the JSON submission. Kept a distinct path so it is additive to the existing JSON
 * `…/submissions` endpoint.
 *
 * @param model - Optional catalog model id — appended as a `model` form part; the BE
 *   persists it (`grading_model`) and forwards it to the grader. Omit → BE default.
 */
export const submitChallengeFile = async (
    id: string,
    file: File,
    model?: string,
): Promise<SubmissionView> => {
    const formData = new FormData()
    formData.append("file", file)
    if (model) {
        formData.append("model", model)
    }
    const view = await restRequest<SubmissionView>({
        method: "POST",
        url: `/challenges/${id}/submissions/file`,
        data: formData,
        headers: { "Content-Type": null as unknown as string },
    })
    return normalizeSubmissionView(view)
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
    const views = await restRequest<Array<SubmissionView>>({
        method: "GET",
        url: `/challenges/${id}/submissions/me`,
    })
    return views.map(normalizeSubmissionView)
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
    const view = await restRequest<SubmissionResultsView>({
        method: "GET",
        url: `/challenges/${id}/submissions/${submissionId}/results`,
    })
    return { ...view, status: normalizeSubmissionStatus(view.status) }
}

/**
 * Lists the file tree of a graded PROJECT submission (PIN §3C). The BE serves it
 * server-side (downloads the submission's uploaded zip → unzips in-memory with the
 * SSRF/zip-bomb guards → returns the whitelisted `{path, size}` entries), ownership-gated
 * to the submission owner (or `canManage`) — the FE never fetches Cloudinary directly.
 *
 * `GET /api/v1/challenges/{id}/submissions/{submissionId}/project/tree`
 *
 * @param id - The challenge UUID the submission belongs to.
 * @param submissionId - The graded project submission whose tree to load.
 * @returns The project-relative file entries; `[]` when the zip carries no code files.
 */
export const getSubmissionProjectTree = async (
    id: string,
    submissionId: string,
): Promise<Array<ProjectTreeEntry>> => {
    return restRequest<Array<ProjectTreeEntry>>({
        method: "GET",
        url: `/challenges/${id}/submissions/${submissionId}/project/tree`,
    })
}

/**
 * Returns the content of ONE file of a graded PROJECT submission (PIN §3C). The BE
 * re-reads it from the submission's zip server-side (path-traversal guard, whitelist,
 * size cap), ownership-gated like {@link getSubmissionProjectTree}. `path` is sent as a
 * query param (encoded by axios) so a nested path (`src/app.py`) round-trips intact.
 *
 * `GET /api/v1/challenges/{id}/submissions/{submissionId}/project/file?path=`
 *
 * @param id - The challenge UUID the submission belongs to.
 * @param submissionId - The graded project submission the file lives in.
 * @param path - The project-relative file path (from a tree entry) to read.
 * @returns The file's `{path, content}` (UTF-8 text).
 */
export const getSubmissionProjectFile = async (
    id: string,
    submissionId: string,
    path: string,
): Promise<ProjectFileView> => {
    return restRequest<ProjectFileView>({
        method: "GET",
        url: `/challenges/${id}/submissions/${submissionId}/project/file`,
        params: { path },
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
