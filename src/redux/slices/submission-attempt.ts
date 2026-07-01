import {
    createSlice,
    type PayloadAction,
} from "@reduxjs/toolkit"
import type { SubmissionAttemptEntity } from "@/modules/types/entities/submission-attempt"

/**
 * Client state for paginated submission attempts scoped to a challenge submission.
 */
export interface SubmissionAttemptSlice {
    /** The submission attempt id (selected row for feedback details). */
    id?: string
    /** The submission attempt. */
    submissionAttempt?: SubmissionAttemptEntity
    /** The submission attempts. */
    submissionAttempts: Array<SubmissionAttemptEntity>
    /** The count of the submission attempts. */
    count: number
    /** Which challenge submission row the attempts list / drawer is scoped to. */
    activeChallengeSubmissionId?: string
    /** 1-based page for the paginated `submissionAttempts` list. */
    pageNumber?: number
    /** Page size for `submissionAttempts` query. */
    limit?: number
}

/**
 * The initial state of the challenge submission slice.
 */
const initialState: SubmissionAttemptSlice = {
    /** The submission attempt id. */
    id: undefined,
    /** The submission attempt. */
    submissionAttempt: undefined,
    /** The submission attempts. */
    submissionAttempts: [],
    /** The count of the submission attempts. */
    count: 0,
    /** Which challenge submission row the attempts list is scoped to. */
    activeChallengeSubmissionId: undefined,
    /** 1-based page. */
    pageNumber: 1,
    /** Page size. */
    limit: 10,
}

/**
 * Slice managing submission attempts for the currently focused challenge submission.
 */
export const submissionAttemptSlice = createSlice(
    {
        /** The name of the slice. */
        name: "submissionAttempt",
        /** The initial state of the slice. */
        initialState,
        /** The reducers of the slice. */
        reducers: {
            /** The action to set the submission attempt id. */
            setSubmissionAttemptId: (
                state, 
                action: PayloadAction<string | undefined>
            ) => {
                state.id = action.payload
            },
            /** The action to set the submission attempt. */
            setSubmissionAttempt: (
                state, 
                action: PayloadAction<SubmissionAttemptEntity | undefined>
            ) => {
                state.submissionAttempt = action.payload
            },
            /** The action to set the submission attempts. */
            setSubmissionAttempts: (
                state, 
                action: PayloadAction<Array<SubmissionAttemptEntity>>
            ) => {
                state.submissionAttempts = action.payload
            },
            /** The action to set the count of the submission attempts. */
            setSubmissionAttemptsCount: (
                state, 
                action: PayloadAction<number>
            ) => {
                state.count = action.payload
            },
            /** The action to set which challenge submission the attempts list refers to. Resets page to 1 when the id changes. */
            setActiveChallengeSubmissionId: (
                state,
                action: PayloadAction<string | undefined>,
            ) => {
                if (state.activeChallengeSubmissionId !== action.payload) {
                    state.pageNumber = 1
                }
                state.activeChallengeSubmissionId = action.payload
            },
            /** The action to set the submission attempts list page (1-based). */
            setSubmissionAttemptsPageNumber: (
                state,
                action: PayloadAction<number | undefined>,
            ) => {
                state.pageNumber = action.payload
            },
            /** The action to set the page size for submission attempts queries. */
            setSubmissionAttemptsLimit: (
                state,
                action: PayloadAction<number | undefined>,
            ) => {
                state.limit = action.payload
            },
        },
    }
)

/** Root reducer for the submission-attempt slice. */
export const submissionAttemptReducer = submissionAttemptSlice.reducer
/** Actions exported from the submission-attempt slice. */
export const {
    setSubmissionAttemptId,
    setSubmissionAttempt,
    setSubmissionAttempts,
    setSubmissionAttemptsCount,
    setActiveChallengeSubmissionId,
    setSubmissionAttemptsPageNumber,
    setSubmissionAttemptsLimit,
} = submissionAttemptSlice.actions