import {
    createSlice,
    type PayloadAction
} from "@reduxjs/toolkit"
import type { JobStatusUpdatedSocketIoMessage } from "@/modules/types/socketio"

/**
 * Redux state for async-job status envelopes.
 *
 * LEGACY: this map was fed by the socket.io `/job_notifications` namespace, whose server never
 * existed on the FTES BE — the socket layer (and its STOMP successor) has been removed (OpenSpec
 * `realtime-transport-decision`, reversal 2026-07-22). The state shape is kept because legacy
 * flows (e.g. `GithubTeamGate`) still read it; no writer currently populates it, so consumers
 * must (and do) degrade to refetch/poll.
 */
export interface SocketIOSlice {
    /** Latest status envelope per job id (no realtime writer — see slice doc). */
    jobStatusByJobId: Record<string, JobStatusUpdatedSocketIoMessage>
}

/**
 * The initial state of the socketio slice.
 */
const initialState: SocketIOSlice = {
    jobStatusByJobId: {},
}

/**
 * Slice storing async-job status messages (legacy realtime shape — see {@link SocketIOSlice}).
 */
export const socketIoSlice = createSlice(
    {
        /** The name of the slice. */
        name: "socketio",
        /** The initial state of the slice. */
        initialState,
        /** The reducers of the slice. */
        reducers: {
            /** Store (or overwrite) the latest status message for a specific job id. */
            setJobStatusMessageForJob: (
                state,
                action: PayloadAction<SetJobStatusMessageForJobPayload>,
            ) => {
                const {
                    jobId,
                    message
                } = action.payload
                state.jobStatusByJobId[jobId] = message
            },
        },
    },
)

/** The payload for the set job status message for job action. */
export interface SetJobStatusMessageForJobPayload {
    /** The job id. */
    jobId: string
    /** The message. */
    message: JobStatusUpdatedSocketIoMessage
}

/** Root reducer for the socketio slice. */
export const socketIoReducer = socketIoSlice.reducer
/** Actions exported from the socketio slice. */
export const {
    setJobStatusMessageForJob,
} = socketIoSlice.actions
