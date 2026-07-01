import { createSlice, type PayloadAction } from "@reduxjs/toolkit"
import type { MilestoneEntity, MilestoneTaskEntity } from "@/modules/types/entities/milestone"

/**
 * Redux state for milestone progress and task selection.
 */
export interface MilestoneState {
    /** All milestone rows for the active course. */
    entities: Array<MilestoneEntity>
    /** Task payload for the current `selectedTaskId` (from `task` GraphQL, hydrated by SWR). */
    selectedTaskDetail?: MilestoneTaskEntity
    /** Currently focused milestone task id. */
    selectedTaskId?: string
    /** Currently focused submission attempt id. */
    selectedAttemptId?: string
    /** Currently focused milestone id. */
    selectedMilestoneId?: string
    /**
     * Maps `milestone_tasks.id` → async grading `jobs.id` after submit succeeds.
     * Used with `socketIo.jobStatusByJobId[jobId]`.
     */
    milestoneTaskIdToJobId: Record<string, string>
}

/** Initial state for the milestone slice. */
const initialState: MilestoneState = {
    entities: [],
    selectedTaskDetail: undefined,
    selectedTaskId: undefined,
    selectedAttemptId: undefined,
    selectedMilestoneId: undefined,
    milestoneTaskIdToJobId: {},
}

/**
 * Slice managing milestone list, task selection, and async grading job tracking.
 */
const slice = createSlice({
    name: "milestone",
    initialState,
    reducers: {
        /** Replace the milestone list (called after `milestones` GraphQL query). */
        setMilestones: (state, action: PayloadAction<Array<MilestoneEntity>>) => {
            state.entities = action.payload
        },
        /** Clear the milestone list and selected task detail (e.g. on course change). */
        resetMilestones: (state) => {
            state.entities = []
            state.selectedTaskDetail = undefined
        },
        /** Store the full task detail payload for the selected task. */
        setSelectedTaskDetail: (state, action: PayloadAction<MilestoneTaskEntity | undefined>) => {
            state.selectedTaskDetail = action.payload
        },
        /** Set the focused task id; clears task detail when the id changes. */
        setSelectedTaskId: (state, action: PayloadAction<string | undefined>) => {
            if (state.selectedTaskId !== action.payload) {
                state.selectedTaskDetail = undefined
            }
            state.selectedTaskId = action.payload
        },
        /** Set the focused submission attempt id. */
        setSelectedAttemptId: (state, action: PayloadAction<string | undefined>) => {
            state.selectedAttemptId = action.payload
        },
        /** Set the focused milestone id. */
        setSelectedMilestoneId: (state, action: PayloadAction<string | undefined>) => {
            state.selectedMilestoneId = action.payload
        },
        /** Record the grading job id for a submitted milestone task. */
        addMilestoneTaskIdToJobId: (state, action: PayloadAction<AddMilestoneTaskIdToJobIdPayload>) => {
            state.milestoneTaskIdToJobId[action.payload.milestoneTaskId] = action.payload.jobId
        },
        /** Remove the grading job mapping once the job reaches a terminal state. */
        removeMilestoneTaskIdToJobId: (state, action: PayloadAction<string>) => {
            delete state.milestoneTaskIdToJobId[action.payload]
        },
    },
})

/** Actions exported from the milestone slice. */
export const {
    setMilestones,
    resetMilestones,
    setSelectedTaskDetail,
    setSelectedTaskId,
    setSelectedAttemptId,
    setSelectedMilestoneId,
    addMilestoneTaskIdToJobId,
    removeMilestoneTaskIdToJobId,
} = slice.actions
/** Root reducer for the milestone slice. */
export const milestoneReducer = slice.reducer

/** Payload for adding a milestone task ID to job ID mapping. */
export interface AddMilestoneTaskIdToJobIdPayload {
    /** Milestone task ID. */
    milestoneTaskId: string
    /** Job ID. */
    jobId: string
}
