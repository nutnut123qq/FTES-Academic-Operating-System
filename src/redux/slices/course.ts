import {
    createSlice,
    type PayloadAction,
} from "@reduxjs/toolkit"
import type { CourseEntity } from "@/modules/types/entities/course"

/**
 * Client state for the currently active course and the full course catalogue.
 */
export interface CourseSlice {
    /** The course display id. */
    displayId?: string
    /** The course entity. */
    entity?: CourseEntity
    /** The course id. */
    id?: string
    /** The course entities */
    entities?: Array<CourseEntity>
}

/**
 * The initial state of the course slice.
 */
const initialState: CourseSlice = {
    /** The course display id. */
    displayId: undefined,
    /** The course entity. */
    entity: undefined,
    /** The course id. */
    id: undefined,
    /** The course entities. */
    entities: [],
}

/**
 * Slice tracking the active course (entity, id, displayId) and the course catalogue list.
 */
export const courseSlice = createSlice(
    {
        /** The name of the slice. */
        name: "course",
        /** The initial state of the slice. */
        initialState,
        /** The reducers of the slice. */
        reducers: {
            /** The action to set the course. */
            setCourse: (
                state, 
                action: PayloadAction<CourseEntity | undefined>
            ) => {
                state.entity = action.payload
                state.id = action.payload?.id
                state.displayId = action.payload?.displayId
            },
            /** The action to set the courses. */
            setCourses: (
                state, 
                action: PayloadAction<Array<CourseEntity>>
            ) => {
                state.entities = action.payload
            },
            /** The action to set the course id. */
            setCourseDisplayId: (
                state, 
                action: PayloadAction<string | undefined>
            ) => {
                state.displayId = action.payload
            },
            /** The action to set the course id. */
            setCourseId: (
                state, 
                action: PayloadAction<string | undefined>
            ) => {
                state.id = action.payload
            },
        },
    }
)

/** Root reducer for the course slice. */
export const courseReducer = courseSlice.reducer
/** Actions exported from the course slice. */
export const {
    setCourse,
    setCourses,
    setCourseDisplayId,
    setCourseId,
} = courseSlice.actions