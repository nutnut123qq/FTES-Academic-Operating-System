import {
    createSlice,
    type PayloadAction,
} from "@reduxjs/toolkit"
import type { PersonalProjectTaskEntity } from "@/modules/types/entities/personal-project-task"

/**
 * The slice for personal project tasks (Trello board columns).
 */
export interface PersonalProjectTaskSlice {
    /** Todo tasks. */
    todoEntities: Array<PersonalProjectTaskEntity>
    /** In-progress tasks. */
    inProgressEntities: Array<PersonalProjectTaskEntity>
    /** Done tasks. */
    doneEntities: Array<PersonalProjectTaskEntity>
    /** Cursor for the next page of todo tasks. undefined = no more pages. */
    todoCursor: string | undefined
    /** Cursor for the next page of in-progress tasks. */
    inProgressCursor: string | undefined
    /** Cursor for the next page of done tasks. */
    doneCursor: string | undefined
}

/**
 * The initial state of the personal project task slice.
 */
const initialState: PersonalProjectTaskSlice = {
    todoEntities: [],
    inProgressEntities: [],
    doneEntities: [],
    todoCursor: undefined,
    inProgressCursor: undefined,
    doneCursor: undefined,
}

/**
 * The slice for personal project tasks.
 */
export const personalProjectTaskSlice = createSlice(
    {
        /** The name of the slice. */
        name: "personalProjectTask",
        /** The initial state of the slice. */
        initialState,
        /** The reducers of the slice. */
        reducers: {
            /** Set (replace) todo tasks — used on first load. */
            setTodoTasks: (
                state, 
                action: PayloadAction<Array<PersonalProjectTaskEntity>>
            ) => {
                state.todoEntities = action.payload
            },
            /** Append more todo tasks — used on infinite scroll. */
            appendTodoTasks: (
                state,
                action: PayloadAction<Array<PersonalProjectTaskEntity>>
            ) => {
                state.todoEntities = [...state.todoEntities, ...action.payload]
            },
            /** Set the cursor for the next page of todo tasks. */
            setTodoCursor: (
                state,
                action: PayloadAction<string | undefined>
            ) => {
                state.todoCursor = action.payload
            },
            /** Set (replace) in-progress tasks. */
            setInProgressTasks: (
                state, 
                action: PayloadAction<Array<PersonalProjectTaskEntity>>
            ) => {
                state.inProgressEntities = action.payload
            },
            /** Append more in-progress tasks. */
            appendInProgressTasks: (
                state,
                action: PayloadAction<Array<PersonalProjectTaskEntity>>
            ) => {
                state.inProgressEntities = [...state.inProgressEntities, ...action.payload]
            },
            /** Set the cursor for the next page of in-progress tasks. */
            setInProgressCursor: (
                state,
                action: PayloadAction<string | undefined>
            ) => {
                state.inProgressCursor = action.payload
            },
            /** Set (replace) done tasks. */
            setDoneTasks: (
                state, 
                action: PayloadAction<Array<PersonalProjectTaskEntity>>
            ) => {
                state.doneEntities = action.payload
            },
            /** Append more done tasks. */
            appendDoneTasks: (
                state,
                action: PayloadAction<Array<PersonalProjectTaskEntity>>
            ) => {
                state.doneEntities = [...state.doneEntities, ...action.payload]
            },
            /** Set the cursor for the next page of done tasks. */
            setDoneCursor: (
                state,
                action: PayloadAction<string | undefined>
            ) => {
                state.doneCursor = action.payload
            },
        },
    }
)

/** Root reducer for the personal-project-task slice. */
export const personalProjectTaskReducer = personalProjectTaskSlice.reducer
/** Actions exported from the personal-project-task slice. */
export const {
    setTodoTasks,
    appendTodoTasks,
    setTodoCursor,
    setInProgressTasks,
    appendInProgressTasks,
    setInProgressCursor,
    setDoneTasks,
    appendDoneTasks,
    setDoneCursor,
} = personalProjectTaskSlice.actions
