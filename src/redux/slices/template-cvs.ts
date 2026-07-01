import {
    createSlice,
    type PayloadAction,
} from "@reduxjs/toolkit"
import type { TemplateCVEntity } from "@/modules/types/entities/template-cv"

/**
 * Redux mirror of the `templateCvs` GraphQL query (rubric rows for CV review).
 */
export interface TemplateCvsSlice {
    /** Latest template CV rows returned by the API. */
    rows: Array<TemplateCVEntity>
}

/** Initial state for the template-cvs slice. */
const initialState: TemplateCvsSlice = {
    rows: [],
}

/**
 * Slice caching the CV review rubric template list from the API.
 */
export const templateCvsSlice = createSlice({
    name: "templateCvs",
    initialState,
    reducers: {
        /** Replace the template CV rows with the latest API response. */
        setTemplateCvs: (
            state,
            action: PayloadAction<Array<TemplateCVEntity>>,
        ) => {
            state.rows = action.payload
        },
    },
})

/** Root reducer for the template-cvs slice. */
export const templateCvsReducer = templateCvsSlice.reducer
/** Actions exported from the template-cvs slice. */
export const { setTemplateCvs } = templateCvsSlice.actions
