import {
    createSlice,
    type PayloadAction,
} from "@reduxjs/toolkit"
import type { CvUrlPayload } from "@/modules/types/cv-upload"

/**
 * Redux state for the current user's CV presigned view URL (`cvUrl` query).
 */
export interface CvUrlSlice {
    /** Latest `cvUrl` query payload for the signed-in user, or null if none. */
    entity: CvUrlPayload | null
}

/** Initial state for the cv-url slice. */
const initialState: CvUrlSlice = {
    entity: null,
}

/**
 * Slice caching the presigned CV view URL returned by the `cvUrl` GraphQL query.
 */
export const cvUrlSlice = createSlice({
    name: "cvUrl",
    initialState,
    reducers: {
        /** Store (or clear) the latest CV presigned URL payload. */
        setCvUrl: (
            state,
            action: PayloadAction<CvUrlPayload | null>,
        ) => {
            state.entity = action.payload
        },
    },
})

/** Root reducer for the cv-url slice. */
export const cvUrlReducer = cvUrlSlice.reducer
/** Actions exported from the cv-url slice. */
export const {
    setCvUrl,
} = cvUrlSlice.actions
