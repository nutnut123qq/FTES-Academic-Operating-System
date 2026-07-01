import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

/**
 * Selected CV submission attempt shown in the analysis modal.
 */
export interface CvSubmissionAttemptAnalysisItem {
    /** Unique attempt id from the API. */
    attemptId: string
    /** Human-visible attempt number. */
    attemptNumber: number
    /** Display label for the uploaded CV file. */
    fileLabel: string
    /** Public or signed URL for opening the CV file. */
    fileUrl: string
    /** Whether the file URL can be opened directly. */
    fileUrlIsPublic: boolean
    /** Formatted submission timestamp. */
    submittedAtLabel: string
    /** Raw attempt status from the API. */
    status: string
    /** Full AI feedback markdown for this attempt. */
    detailFeedback: string
}

/**
 * Redux state for the CV submission attempt analysis modal.
 */
export interface CvSubmissionAttemptAnalysisSlice {
    /** Attempt currently selected for the analysis modal. */
    selectedAttempt: CvSubmissionAttemptAnalysisItem | null
}

/** Initial state for the cv-submission-attempt-analysis slice. */
const initialState: CvSubmissionAttemptAnalysisSlice = {
    selectedAttempt: null,
}

/**
 * Slice tracking which CV submission attempt is open in the analysis modal.
 */
export const cvSubmissionAttemptAnalysisSlice = createSlice({
    name: "cvSubmissionAttemptAnalysis",
    initialState,
    reducers: {
        /** Set the attempt to display in the analysis modal. */
        setSelectedCvSubmissionAttemptAnalysis: (
            state,
            action: PayloadAction<CvSubmissionAttemptAnalysisItem>,
        ) => {
            state.selectedAttempt = action.payload
        },
        /** Clear the selected attempt (e.g. when the modal is closed). */
        clearSelectedCvSubmissionAttemptAnalysis: (state) => {
            state.selectedAttempt = null
        },
    },
})

/** Actions exported from the cv-submission-attempt-analysis slice. */
export const {
    setSelectedCvSubmissionAttemptAnalysis,
    clearSelectedCvSubmissionAttemptAnalysis,
} = cvSubmissionAttemptAnalysisSlice.actions

/** Root reducer for the cv-submission-attempt-analysis slice. */
export const cvSubmissionAttemptAnalysisReducer = cvSubmissionAttemptAnalysisSlice.reducer
