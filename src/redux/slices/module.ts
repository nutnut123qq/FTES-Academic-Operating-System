import {
    createSlice,
    type PayloadAction,
} from "@reduxjs/toolkit"
import type { ModuleEntity } from "@/modules/types/entities/module"

/**
 * Client state for the active course module and paginated module list.
 */
export interface ModuleSlice {
    /** When set, `useQueryModuleSwr` fetches this row (`module` query). */
    id?: string
    /** The module display id. */
    displayId?: string
    /** The module entity. */
    entity?: ModuleEntity
    /** The contents page number. */
    pageNumber?: number
    /** The contents limit. */
    limit?: number
    /** The modules list (from ES query). */
    modules?: Array<ModuleEntity>
}

/** Initial state for the module slice. */
const initialState: ModuleSlice = {
    /** When set, `useQueryModuleSwr` fetches this row (`module` query). */
    id: undefined,
    /** The module display id. */
    displayId: undefined,
    /** The module entity. */
    entity: undefined,
    /** The modules page number. */
    pageNumber: undefined,
    /** The modules limit. */
    limit: undefined,
    /** The modules list. */
    modules: undefined,
}

/**
 * Slice tracking the active module entity and the paginated module list for the current course.
 */
export const moduleSlice = createSlice(
    {
        /** The name of the slice. */
        name: "module",
        /** The initial state of the slice. */
        initialState,
        /** The reducers of the slice. */
        reducers: {
            /** The action to set the module. */
            setModule: (
                state, 
                action: PayloadAction<ModuleEntity | undefined>
            ) => {
                state.entity = action.payload
            },
            /** The action to set the module display id. */
            setModuleDisplayId: (
                state, 
                action: PayloadAction<string | undefined>
            ) => {
                state.displayId = action.payload
            },
            /** The action to set the module id. */
            setModuleId: (
                state, 
                action: PayloadAction<string | undefined>
            ) => {
                state.id = action.payload
            },
            /** The action to set the module page number. */
            setModulePageNumber: (
                state,
                action: PayloadAction<number | undefined>,
            ) => {
                state.pageNumber = action.payload
            },
            /** The action to set the modules limit. */
            setModuleLimit: (
                state,
                action: PayloadAction<number | undefined>,
            ) => {
                state.limit = action.payload
            },
            /** The action to set the modules list. */
            setModules: (
                state,
                action: PayloadAction<Array<ModuleEntity> | undefined>,
            ) => {
                state.modules = action.payload
            },
        },
    }
)

/** Root reducer for the module slice. */
export const moduleReducer = moduleSlice.reducer
/** Actions exported from the module slice. */
export const {
    setModule,
    setModuleDisplayId,
    setModuleId,
    setModulePageNumber,
    setModuleLimit,
    setModules,
} = moduleSlice.actions