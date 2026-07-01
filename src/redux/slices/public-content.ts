import {
    createSlice,
    type PayloadAction,
} from "@reduxjs/toolkit"
import type { ContentEntity } from "@/modules/types/entities/content"

/**
 * The slice for public content (non-premium, shareable content).
 */
export interface PublicContentSlice {
    /** When set, `useQueryPublicContentSwr` fetches this row. */
    displayId?: string
    /** The public content entity. */
    entity?: ContentEntity
}

/**
 * The initial state of the public content slice.
 */
const initialState: PublicContentSlice = {
    /** The public content display id. */
    displayId: undefined,
    /** The public content. */
    entity: undefined,
}

/**
 * The slice for public content.
 */
export const publicContentSlice = createSlice(
    {
        /** The name of the slice. */
        name: "publicContent",
        /** The initial state of the slice. */
        initialState,
        /** The reducers of the slice. */
        reducers: {
            /** The action to set the public content display id. */
            setPublicContentDisplayId: (
                state, 
                action: PayloadAction<string | undefined>
            ) => {
                state.displayId = action.payload
            },
            /** The action to set the public content entity. */
            setPublicContent: (
                state, 
                action: PayloadAction<ContentEntity | undefined>
            ) => {
                state.entity = action.payload
            },
        },
    }
)

/** Root reducer for the public-content slice. */
export const publicContentReducer = publicContentSlice.reducer
/** Actions exported from the public-content slice. */
export const {
    setPublicContentDisplayId,
    setPublicContent,
} = publicContentSlice.actions
