import {
    createSlice,
    type PayloadAction,
} from "@reduxjs/toolkit"
import type { IncompleteJobsItem } from "@/modules/types/incomplete-job"
import { JobStatus } from "@/modules/types/enums/job-status"

/**
 * Job-related client state: in-flight / incomplete work keyed by API snapshots.
 */
export interface JobSlice {
    /**
     * Incomplete jobs for the current course (`jobId` + `status`), filled from GraphQL
     * and trimmed/updated via {@link applyIncompleteJobStatus} when Socket.IO pushes status.
     */
    incompleteJobs: Array<IncompleteJobsItem>
}

/** Initial state for the job slice. */
const initialState: JobSlice = {
    incompleteJobs: [],
}

/**
 * Slice tracking in-flight background jobs for the current course (grading, CV review, etc.).
 */
export const jobSlice = createSlice(
    {
        name: "job",
        initialState,
        reducers: {
            /** Replace the entire incomplete-jobs list (called on first GraphQL fetch). */
            setIncompleteJobs: (
                state,
                action: PayloadAction<Array<IncompleteJobsItem>>,
            ) => {
                state.incompleteJobs = action.payload
            },
            /**
             * Merge a socket `JobStatusUpdated` into the list: update `status` while queued/processing;
             * drop the row when the job is terminal (no longer "incomplete").
             */
            applyIncompleteJobStatus: (
                state,
                action: PayloadAction<ApplyIncompleteJobStatusPayload>,
            ) => {
                const { jobId, status } = action.payload
                const i = state.incompleteJobs.findIndex(
                    (incompleteJob) => incompleteJob.jobId === jobId,
                )
                if (i === -1) {
                    return
                }
                if (status === JobStatus.Completed || status === JobStatus.Failed) {
                    state.incompleteJobs.splice(
                        i,
                        1,
                    )
                } else {
                    state.incompleteJobs[i] = {
                        jobId,
                        status,
                    }
                }
            },
        },
    },
)

/** Payload for updating a single job's status from a Socket.IO event. */
export interface ApplyIncompleteJobStatusPayload {
    /** `JobStatusUpdated.data.jobId` */
    jobId: string
    /** `JobStatusUpdated.data.status` */
    status: JobStatus
}

/** Root reducer for the job slice. */
export const jobReducer = jobSlice.reducer
/** Actions exported from the job slice. */
export const {
    setIncompleteJobs,
    applyIncompleteJobStatus,
} = jobSlice.actions
