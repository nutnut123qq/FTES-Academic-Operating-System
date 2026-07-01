import {
    createSlice,
    type PayloadAction,
} from "@reduxjs/toolkit"
import type { FoundationCategoryEntity } from "@/modules/types/entities/foundation-category"
import type { FoundationEntity } from "@/modules/types/entities/foundation"

/**
 * Redux state for the Foundations section (categories + paginated foundation list).
 */
export interface FoundationSlice {
    /** Selected category id (from URL). */
    categoryId?: string
    /** Selected foundation id (detail route). */
    foundationId?: string
    /** Selected category entity. */
    category?: FoundationCategoryEntity
    /** Selected foundation entity (detail view). */
    entity?: FoundationEntity
    /** All categories from `foundationCategories` query. */
    categories?: Array<FoundationCategoryEntity>
    /** Foundations for the active category. */
    entities?: Array<FoundationEntity>
    /** Total foundations count for pagination. */
    count?: number
    /** Current page number (1-based). */
    pageNumber?: number
    /** Page size. */
    limit?: number
    /** Server-side search string for the foundations list (debounced). */
    search?: string
}

/** Initial state for the foundation slice. */
const initialState: FoundationSlice = {
    categoryId: undefined,
    foundationId: undefined,
    category: undefined,
    entity: undefined,
    categories: undefined,
    entities: undefined,
    count: undefined,
    pageNumber: 1,
    limit: 100,
    search: undefined,
}

/**
 * Slice managing foundation category selection, foundation list, and pagination.
 */
export const foundationSlice = createSlice({
    name: "foundation",
    initialState,
    reducers: {
        /** Set the active foundation category id (drives filtered list fetch). */
        setFoundationCategoryId: (
            state,
            action: PayloadAction<string | undefined>,
        ) => {
            state.categoryId = action.payload
        },
        /** Set the active foundation id (drives detail view fetch). */
        setFoundationId: (
            state,
            action: PayloadAction<string | undefined>,
        ) => {
            state.foundationId = action.payload
        },
        /** Store the foundation detail entity. */
        setFoundation: (
            state,
            action: PayloadAction<FoundationEntity | undefined>,
        ) => {
            state.entity = action.payload
        },
        /** Store the active category entity. */
        setFoundationCategory: (
            state,
            action: PayloadAction<FoundationCategoryEntity | undefined>,
        ) => {
            state.category = action.payload
        },
        /** Replace the full list of foundation categories. */
        setFoundationCategories: (
            state,
            action: PayloadAction<Array<FoundationCategoryEntity> | undefined>,
        ) => {
            state.categories = action.payload
        },
        /** Replace the current page of foundation entities. */
        setFoundations: (
            state,
            action: PayloadAction<Array<FoundationEntity> | undefined>,
        ) => {
            state.entities = action.payload
        },
        /** Set the total count of foundations (for pagination controls). */
        setFoundationsCount: (
            state,
            action: PayloadAction<number | undefined>,
        ) => {
            state.count = action.payload
        },
        /** Set the current page number for the foundation list. */
        setFoundationPageNumber: (
            state,
            action: PayloadAction<number | undefined>,
        ) => {
            state.pageNumber = action.payload
        },
        /** Set the page size for the foundation list query. */
        setFoundationLimit: (
            state,
            action: PayloadAction<number | undefined>,
        ) => {
            state.limit = action.payload
        },
        /** Set the (debounced) search string for the foundation list query. */
        setFoundationSearch: (
            state,
            action: PayloadAction<string | undefined>,
        ) => {
            state.search = action.payload
        },
    },
})

/** Root reducer for the foundation slice. */
export const foundationReducer = foundationSlice.reducer
/** Actions exported from the foundation slice. */
export const {
    setFoundationCategoryId,
    setFoundationId,
    setFoundation,
    setFoundationCategory,
    setFoundationCategories,
    setFoundations,
    setFoundationsCount,
    setFoundationPageNumber,
    setFoundationLimit,
    setFoundationSearch,
} = foundationSlice.actions
