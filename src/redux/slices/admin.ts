import {
    createSlice,
    type PayloadAction,
} from "@reduxjs/toolkit"

/**
 * The slice for the admin state.
 */
export interface AdminSlice {
    /** The admin API key for presigned URL and other admin operations. */
    apiKey: string
}

/**
 * The initial state of the admin slice.
 */
const initialState: AdminSlice = {
    /** The admin API key. */
    apiKey: "",
}

/**
 * The slice for the admin.
 */
export const adminSlice = createSlice({
    /** The name of the slice. */
    name: "admin",
    /** The initial state of the slice. */
    initialState,
    /** The reducers of the slice. */
    reducers: {
        /** The action to set the admin API key. */
        setAdminApiKey: (
            state,
            action: PayloadAction<string>,
        ) => {
            state.apiKey = action.payload
        },
        /** The action to clear the admin API key. */
        clearAdminApiKey: (state) => {
            state.apiKey = ""
        },
    },
})

/**
 * The reducer for the admin slice.
 */
export const adminReducer = adminSlice.reducer

/**
 * The actions for the admin slice.
 */
export const {
    setAdminApiKey,
    clearAdminApiKey,
} = adminSlice.actions
