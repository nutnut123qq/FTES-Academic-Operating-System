import { restRequest } from "@/modules/api/rest/client"
import type {
    AnswerSavedView,
    AnswerUpsertRequest,
    AttemptListView,
    DrawSessionRequest,
    MockInterviewStatsView,
    ScorecardView,
    SessionDrawView,
    SessionView,
    SyncResultView,
    SyncTurnsRequest,
} from "./types"

const BASE = "/ai/mock-interview"

// ---------------- writes ----------------

/** Server draws a session (AI-generated questions) for an enrolled learner. */
export const drawSession = async (request: DrawSessionRequest): Promise<SessionDrawView> =>
    restRequest<SessionDrawView>({
        method: "POST",
        url: `${BASE}/sessions`,
        data: request,
    })

/** Upsert one answer onto the transcript. */
export const saveAnswer = async (
    sessionId: string,
    request: AnswerUpsertRequest,
): Promise<AnswerSavedView> =>
    restRequest<AnswerSavedView>({
        method: "POST",
        url: `${BASE}/sessions/${sessionId}/answers`,
        data: request,
    })

/** One-shot grade the whole transcript into a scorecard. */
export const gradeSession = async (sessionId: string): Promise<ScorecardView> =>
    restRequest<ScorecardView>({
        method: "POST",
        url: `${BASE}/sessions/${sessionId}/grade`,
        data: {},
    })

/** Snapshot the transcript + position for resume (no-op once completed). */
export const syncTurns = async (
    sessionId: string,
    request: SyncTurnsRequest,
): Promise<SyncResultView> =>
    restRequest<SyncResultView>({
        method: "POST",
        url: `${BASE}/sessions/${sessionId}/turns`,
        data: request,
    })

// ---------------- reads ----------------

export const getSession = async (sessionId: string): Promise<SessionView> =>
    restRequest<SessionView>({
        method: "GET",
        url: `${BASE}/sessions/${sessionId}`,
        authenticated: true,
    })

/** Most recent in-progress session for the course within the resume window, else null. */
export const getInProgress = async (courseRef: string): Promise<SessionView | null> =>
    restRequest<SessionView | null>({
        method: "GET",
        url: `${BASE}/in-progress`,
        params: { courseRef },
        authenticated: true,
    })

export const getAttempts = async (
    courseRef: string,
    limit = 10,
    offset = 0,
): Promise<AttemptListView> =>
    restRequest<AttemptListView>({
        method: "GET",
        url: `${BASE}/attempts`,
        params: { courseRef, limit, offset },
        authenticated: true,
    })

export const getAttemptBySession = async (sessionId: string): Promise<ScorecardView | null> =>
    restRequest<ScorecardView | null>({
        method: "GET",
        url: `${BASE}/attempts/by-session/${sessionId}`,
        authenticated: true,
    })

export const getStats = async (courseRef: string): Promise<MockInterviewStatsView> =>
    restRequest<MockInterviewStatsView>({
        method: "GET",
        url: `${BASE}/stats`,
        params: { courseRef },
        authenticated: true,
    })
