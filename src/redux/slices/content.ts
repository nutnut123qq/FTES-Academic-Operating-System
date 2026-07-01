import {
    createSlice,
    type PayloadAction,
} from "@reduxjs/toolkit"
import type { ContentEntity } from "@/modules/types/entities/content"

/**
 * Client state for the active content entity and the paginated content list.
 */
export interface ContentSlice {
    /** When set, `useQueryContentSwr` fetches this row (`content` query). */
    id?: string
    /** The content display id. */
    displayId?: string
    /** The content entity. */
    entity?: ContentEntity
    /** The contents entities. */
    entities?: Array<ContentEntity>
    /** The contents page number. */
    pageNumber?: number
    /** The contents limit. */
    limit?: number
    /** The contents count. */
    count?: number
    /** Whether the current content is read by the user. */
    isRead?: boolean
    /** Whether the current content is favorited by the user. */
    isFavorite?: boolean
    /**
     * User-selected programming language for SCHEMA V2 `bodies`.
     * `null` lets {@link resolveActiveProgrammingLang} pick the first available lang.
     */
    selectedProgrammingLang: string | null
}

/**
 * The initial state of the content slice.
 */
const initialState: ContentSlice = {
    /** When set, `useQueryContentSwr` fetches this row (`content` query). */
    id: undefined,
    /** The content display id. */
    displayId: undefined,
    /** The content. */
    entity: undefined,
    /** The contents entities. */
    entities: [],
    /** The contents page number. */
    pageNumber: undefined,
    /** The contents limit. */
    limit: undefined,
    /** The contents count. */
    count: undefined,
    /** Whether the current content is read. */
    isRead: undefined,
    /** Whether the current content is favorited. */
    isFavorite: undefined,
    /** No explicit language tab until the user selects one. */
    selectedProgrammingLang: null,
}

/**
 * Slice tracking the active content entity, content list, pagination, and read/favorite flags.
 */
export const contentSlice = createSlice(
    {
        /** The name of the slice. */
        name: "content",
        /** The initial state of the slice. */
        initialState,
        /** The reducers of the slice. */
        reducers: {
            /** The action to set the content. */
            setContent: (
                state, 
                action: PayloadAction<ContentEntity | undefined>
            ) => {
                state.entity = action.payload
            },
            /** The action to set the content display id. */
            setContentDisplayId: (
                state, 
                action: PayloadAction<string | undefined>
            ) => {
                state.displayId = action.payload
            },
            /** The action to set the contents. */
            setContents: (
                state, 
                action: PayloadAction<Array<ContentEntity>>
            ) => {
                state.entities = action.payload
            },
            /** The action to set the content id. */
            setContentId: (
                state, 
                action: PayloadAction<string | undefined>
            ) => {
                const nextId = action.payload
                if (state.entity?.id !== nextId) {
                    state.entity = undefined
                }
                state.id = nextId
                state.selectedProgrammingLang = null
            },
            /** Sets the active SCHEMA V2 programming-language tab. */
            setContentSelectedProgrammingLang: (
                state,
                action: PayloadAction<string | null>,
            ) => {
                state.selectedProgrammingLang = action.payload
            },
            /** The action to set the content page number. */
            setContentPageNumber: (
                state,
                action: PayloadAction<number | undefined>,
            ) => {
                state.pageNumber = action.payload
            },
            /** The action to set the content limit. */
            setContentLimit: (
                state,
                action: PayloadAction<number | undefined>,
            ) => {
                state.limit = action.payload
            },
            /** The action to set the contents count. */
            setContentsCount: (
                state,
                action: PayloadAction<number | undefined>,
            ) => {
                state.count = action.payload
            },
            /** The action to set the content read status. */
            setContentIsRead: (
                state,
                action: PayloadAction<boolean | undefined>,
            ) => {
                state.isRead = action.payload
            },
            /** The action to set the content favorite status. */
            setContentIsFavorite: (
                state,
                action: PayloadAction<boolean | undefined>,
            ) => {
                state.isFavorite = action.payload
            },
        },
    }
)

/** Root reducer for the content slice. */
export const contentReducer = contentSlice.reducer
/** Actions exported from the content slice. */
export const {
    setContent,
    setContents,
    setContentId,
    setContentDisplayId,
    setContentPageNumber,
    setContentLimit,
    setContentsCount,
    setContentIsRead,
    setContentIsFavorite,
    setContentSelectedProgrammingLang,
} = contentSlice.actions