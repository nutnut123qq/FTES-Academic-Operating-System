import {
    createSlice,
    type PayloadAction,
} from "@reduxjs/toolkit"
import type { ChallengeEntity } from "@/modules/types/entities/challenge"
import type { ChallengeSubmissionEntity } from "@/modules/types/entities/challenge-submission"
import type { ChallengeSubmissionProgressItem } from "@/modules/api/graphql/queries/types/challenge-submission-progress"

/**
 * Client state for the active challenge, challenge list, submissions, and async grading jobs.
 */
export interface ChallengeSlice {
    /** When set, `useQueryChallengeSwr` fetches this row (`challenge` query). */
    id?: string
    /** The challenges entities. */
    entities?: Array<ChallengeEntity>
    /** The challenge entity. */
    entity?: ChallengeEntity
    /** The challenges page number. */
    pageNumber?: number
    /** The challenges limit. */
    limit?: number
    /** The challenges count. */
    count?: number
    /** Per-challenge submission progress for the active course (`challengeSubmissionProgress`). */
    completionTasks: Array<ChallengeSubmissionProgressItem>
    /** Rows from `challengeSubmissions` for the focused challenge. */
    challengeSubmissions: Array<ChallengeSubmissionEntity>
    /** The loading challenge submissions. */
    loadingChallengeSubmissionIds: Array<string>
    /**
     * Maps `challenge_submissions.id` → async grading `jobs.id` after submit succeeds.
     * Used with `socketIo.jobStatusByJobId[jobId]`.
     */
    submissionIdToJobId: Record<string, string>
}

/**
 * The initial state of the challenge slice.
 */
const initialState: ChallengeSlice = {
    /** When set, `useQueryChallengeSwr` fetches this row (`challenge` query). */
    id: undefined,
    /** The challenges entities. */
    entities: [],
    /** The challenge. */
    entity: undefined,
    /** The challenges page number. */
    pageNumber: undefined,
    /** The challenges limit. */
    limit: undefined,
    /** The challenges count. */
    count: undefined,
    /** Per-challenge submission progress (see `challengeSubmissionProgress` query). */
    completionTasks: [],
    /** Challenge submission rows (see `challengeSubmissions` query). */
    challengeSubmissions: [],
    /** The loading challenge submissions. */
    loadingChallengeSubmissionIds: [],
    submissionIdToJobId: {},
}

/**
 * Slice tracking the active challenge entity, challenge list, submission rows, and grading job ids.
 */
export const challengeSlice = createSlice(
    {
        /** The name of the slice. */
        name: "challenge",
        /** The initial state of the slice. */
        initialState,
        /** The reducers of the slice. */
        reducers: {
            /** The action to set the challenge. */
            setChallenge: (
                state, 
                action: PayloadAction<ChallengeEntity | undefined>
            ) => {
                const prevId = state.entity?.id
                const nextId = action.payload?.id
                state.entity = action.payload
                if (nextId !== prevId) {
                    state.submissionIdToJobId = {}
                }
            },
            /** The action to set the challenges. */
            setChallenges: (
                state, 
                action: PayloadAction<Array<ChallengeEntity>>
            ) => {
                state.entities = action.payload
            },
            /** The action to set the challenge id. */
            setChallengeId: (
                state, 
                action: PayloadAction<string | undefined>
            ) => {
                state.id = action.payload
            },
            /** The action to set the challenge page number. */
            setChallengePageNumber: (
                state,
                action: PayloadAction<number | undefined>,
            ) => {
                state.pageNumber = action.payload
            },
            /** The action to set the challenge limit. */
            setChallengeLimit: (
                state,
                action: PayloadAction<number | undefined>,
            ) => {
                state.limit = action.payload
            },
            /** The action to set the challenge count. */
            setChallengeCount: (
                state,
                action: PayloadAction<number | undefined>,
            ) => {
                state.count = action.payload
            },
            /** The action to set per-challenge submission progress for the active course. */
            setChallengeCompletionTasks: (
                state,
                action: PayloadAction<Array<ChallengeSubmissionProgressItem>>,
            ) => {
                state.completionTasks = action.payload
            },
            /** The action to set challenge submission rows for the current challenge. */
            setChallengeSubmissions: (
                state,
                action: PayloadAction<Array<ChallengeSubmissionEntity>>,
            ) => {
                state.challengeSubmissions = action.payload
                const nextIds = new Set(action.payload.map((row) => row.id))
                for (const sid of Object.keys(state.submissionIdToJobId)) {
                    if (!nextIds.has(sid)) {
                        delete state.submissionIdToJobId[sid]
                    }
                }
            },
            /** Record the grading job id for a submitted challenge submission. */
            setChallengeSubmissionJobId: (
                state,
                action: PayloadAction<SetChallengeSubmissionJobIdPayload>,
            ) => {
                state.submissionIdToJobId[action.payload.submissionId] = action.payload.jobId
            },
            /** The action to set the loading challenge submission ids. */
            setLoadingChallengeSubmissionIds: (
                state,
                action: PayloadAction<Array<string>>,
            ) => {
                state.loadingChallengeSubmissionIds = action.payload
            },
        },
    }
)

/** Payload for associating a grading job id with a challenge submission. */
export interface SetChallengeSubmissionJobIdPayload {
    /** The `challenge_submissions.id` that was submitted. */
    submissionId: string
    /** The async grading `jobs.id` returned after a successful submit. */
    jobId: string
}

/** Root reducer for the challenge slice. */
export const challengeReducer = challengeSlice.reducer
/** Actions exported from the challenge slice. */
export const {
    setChallenge,
    setChallenges,
    setChallengeId,
    setChallengePageNumber,
    setChallengeLimit,
    setChallengeCount,
    setChallengeCompletionTasks,
    setChallengeSubmissions,
    setChallengeSubmissionJobId,
    setLoadingChallengeSubmissionIds,
} = challengeSlice.actions