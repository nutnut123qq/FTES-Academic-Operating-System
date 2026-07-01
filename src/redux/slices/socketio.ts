import {
    createSlice,
    type PayloadAction
} from "@reduxjs/toolkit"
import type { GlobalSearchSocketIoMessage, JobStatusUpdatedSocketIoMessage } from "@/modules/types/socketio"
import { AiLabRunStatus, type AiLabRunChunkData } from "@/hooks/socketio/types/ai-lab"

/**
 * Redux state for data pushed over Socket.IO connections.
 */
export interface SocketIOSlice {
    /** The global search results. */
    globalSearchResults?: GlobalSearchSocketIoMessage
    /** Latest status envelope per job id (from job_notifications namespace). */
    jobStatusByJobId: Record<string, JobStatusUpdatedSocketIoMessage>
    /** Accumulated streaming state per AI Lab run id (from the ai_lab namespace). */
    aiLabRunById: Record<string, AiLabRunStreamState>
}

/** Accumulated client-side state for a single streaming AI Lab run. */
export interface AiLabRunStreamState {
    /** The run id. */
    runId: string
    /** The output text accumulated from streamed deltas. */
    output: string
    /** Current run status. */
    status: AiLabRunStatus
    /** Whether the terminal chunk has arrived. */
    done: boolean
    /** Prompt token count (set on the terminal chunk). */
    promptTokens?: number
    /** Completion token count (set on the terminal chunk). */
    completionTokens?: number
    /** Error detail when `status` is `failed`. */
    errorMessage?: string
}

/**
 * The initial state of the socketio slice.
 */
const initialState: SocketIOSlice = {
    /** The global search results. */
    globalSearchResults: undefined,
    jobStatusByJobId: {},
    aiLabRunById: {},
}

/**
 * Slice storing real-time Socket.IO messages (search results and job status updates).
 */
export const socketIoSlice = createSlice(
    {
        /** The name of the slice. */
        name: "socketio",
        /** The initial state of the slice. */
        initialState,
        /** The reducers of the slice. */
        reducers: {
            /** The action to set the global search results. */
            setGlobalSearchResults: (
                state,
                action: PayloadAction<GlobalSearchSocketIoMessage | undefined>,
            ) => {
                state.globalSearchResults = action.payload
            },
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
            /** Initialize a run's streaming state (called right after the mutation returns a `streaming` runId). */
            startAiLabRun: (
                state,
                action: PayloadAction<StartAiLabRunPayload>,
            ) => {
                const { runId } = action.payload
                state.aiLabRunById[runId] = {
                    runId,
                    output: "",
                    status: AiLabRunStatus.Streaming,
                    done: false,
                }
            },
            /** Append a streamed chunk to a run's output and update status/token counts. */
            appendAiLabRunChunk: (
                state,
                action: PayloadAction<AppendAiLabRunChunkPayload>,
            ) => {
                const { message } = action.payload
                const {
                    runId,
                    delta,
                    done,
                    status,
                    promptTokens,
                    completionTokens,
                } = message
                // Tolerate chunks that arrive before `startAiLabRun` (e.g. fast first delta).
                const existing = state.aiLabRunById[runId] ?? {
                    runId,
                    output: "",
                    status: AiLabRunStatus.Streaming,
                    done: false,
                }
                existing.output += delta ?? ""
                existing.status = status
                existing.done = done
                if (promptTokens !== undefined) {
                    existing.promptTokens = promptTokens
                }
                if (completionTokens !== undefined) {
                    existing.completionTokens = completionTokens
                }
                if (status === AiLabRunStatus.Failed) {
                    existing.errorMessage = message.delta || existing.errorMessage
                }
                state.aiLabRunById[runId] = existing
            },
            /** Drop a run's streaming state (re-run or reset-to-default). */
            resetAiLabRun: (
                state,
                action: PayloadAction<ResetAiLabRunPayload>,
            ) => {
                delete state.aiLabRunById[action.payload.runId]
            },
        },
    },
)

/** Payload for {@link startAiLabRun}. */
export interface StartAiLabRunPayload {
    /** The run id to initialize. */
    runId: string
}

/** Payload for {@link appendAiLabRunChunk}. */
export interface AppendAiLabRunChunkPayload {
    /** The streamed chunk to merge. */
    message: AiLabRunChunkData
}

/** Payload for {@link resetAiLabRun}. */
export interface ResetAiLabRunPayload {
    /** The run id to drop. */
    runId: string
}

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
    setGlobalSearchResults,
    setJobStatusMessageForJob,
    startAiLabRun,
    appendAiLabRunChunk,
    resetAiLabRun,
} = socketIoSlice.actions
