import {
    createSlice,
    type PayloadAction,
} from "@reduxjs/toolkit"

/**
 * Client state for the global search feature.
 */
export interface SearchSlice {
    /** Current global search query. */
    query: string
}

/**
 * The initial state of the search slice.
 */
const initialState: SearchSlice = {
    /** Current global search query. */
    query: "",
}

/**
 * The slice for the search.
 */
export const searchSlice = createSlice({
    /** The name of the slice. */
    name: "search",
    /** The initial state of the slice. */
    initialState,
    /** The reducers of the slice. */
    reducers: {
        /** The action to set the search query. */
        setSearchQuery: (
            state,
            action: PayloadAction<string>,
        ) => {
            state.query = action.payload
        },
        /** The action to clear the search query. */
        clearSearchQuery: (state) => {
            state.query = ""
        },
    },
})

/**
 * The reducer for the search slice.
 */
export const searchReducer = searchSlice.reducer

/**
 * The actions for the search slice.
 */
export const {
    setSearchQuery,
    clearSearchQuery,
} = searchSlice.actions
