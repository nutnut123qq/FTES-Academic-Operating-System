import {
    createSlice,
    type PayloadAction,
} from "@reduxjs/toolkit"

/**
 * Redux state for the selected CV review rubric template.
 */
export interface CvReviewLevelSlice {
    /** Selected `template_cvs.id`, or empty string when no level is selected. */
    selectedTemplateId: string
}

/** Initial state for the cv-review-level slice. */
const initialState: CvReviewLevelSlice = {
    selectedTemplateId: "",
}

/**
 * Slice tracking which CV review rubric template the user has selected.
 */
export const cvReviewLevelSlice = createSlice({
    name: "cvReviewLevel",
    initialState,
    reducers: {
        /** Set the selected CV review rubric template id. */
        setSelectedCvReviewTemplateId: (
            state,
            action: PayloadAction<string>,
        ) => {
            state.selectedTemplateId = action.payload
        },
    },
})

/** Root reducer for the cv-review-level slice. */
export const cvReviewLevelReducer = cvReviewLevelSlice.reducer
/** Actions exported from the cv-review-level slice. */
export const {
    setSelectedCvReviewTemplateId,
} = cvReviewLevelSlice.actions
