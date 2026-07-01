import { createSlice, type PayloadAction } from "@reduxjs/toolkit"
import type { LivestreamSessionEntity } from "@/modules/types/entities/livestream-session"

/**
 * Livestream session list for the current course (Learn tab calendar).
 */
export interface LivestreamSessionSlice {
    /** Loaded livestream session rows. */
    entities?: Array<LivestreamSessionEntity>
    /** Total session count for pagination. */
    count?: number
    /** Current page number (0-based). */
    pageNumber: number
    /** Page size for the livestream sessions query. */
    limit: number
}

/** Initial state for the livestream-session slice. */
const initialState: LivestreamSessionSlice = {
    entities: [],
    count: undefined,
    pageNumber: 0,
    limit: 50,
}

/**
 * Slice storing the paginated livestream session list for the active course.
 */
export const livestreamSessionSlice = createSlice({
    name: "livestreamSession",
    initialState,
    reducers: {
        /** Replace the livestream session list. */
        setLivestreamSessions: (
            state,
            action: PayloadAction<Array<LivestreamSessionEntity>>,
        ) => {
            state.entities = action.payload
        },
        /** Set the total livestream session count. */
        setLivestreamSessionsCount: (
            state,
            action: PayloadAction<number | undefined>,
        ) => {
            state.count = action.payload
        },
        /** Set the current page number for the livestream session list. */
        setLivestreamSessionsPageNumber: (
            state,
            action: PayloadAction<number>,
        ) => {
            state.pageNumber = action.payload
        },
        /** Set the page size for the livestream session query. */
        setLivestreamSessionsLimit: (
            state,
            action: PayloadAction<number>,
        ) => {
            state.limit = action.payload
        },
    },
})

/** Root reducer for the livestream-session slice. */
export const livestreamSessionReducer = livestreamSessionSlice.reducer
/** Actions exported from the livestream-session slice. */
export const {
    setLivestreamSessions,
    setLivestreamSessionsCount,
    setLivestreamSessionsPageNumber,
    setLivestreamSessionsLimit,
} = livestreamSessionSlice.actions
