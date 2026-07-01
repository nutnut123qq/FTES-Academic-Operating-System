import type { SocketIoEnvelope } from "./content-discussion"

/**
 * Lifecycle status of an AI Lab playground run (mirrors backend `AiLabRunStatus`).
 * The server streams `streaming` chunks then a terminal `completed`/`failed`; `cached`
 * is returned synchronously by the mutation and never streamed over the socket.
 */
export enum AiLabRunStatus {
    /** Tokens are actively streaming. */
    Streaming = "streaming",
    /** The run finished successfully. */
    Completed = "completed",
    /** The run failed; see `errorMessage`. */
    Failed = "failed",
    /** Served from cache (no socket stream). */
    Cached = "cached",
}

/**
 * Inner payload of an `ai_lab.run_chunk.subscription` server push — one streamed delta
 * for a given run, plus the running status and (on the terminal chunk) token counts.
 */
export interface AiLabRunChunkData {
    /** The run this chunk belongs to. */
    runId: string
    /** The incremental text appended to the output. */
    delta: string
    /** Whether this is the terminal chunk for the run. */
    done: boolean
    /** Current status of the run. */
    status: AiLabRunStatus
    /** Prompt token count (present on the terminal chunk). */
    promptTokens?: number
    /** Completion token count (present on the terminal chunk). */
    completionTokens?: number
}

/** Server → client envelope for an AI Lab run chunk. */
export type AiLabRunChunkSocketIoMessage = SocketIoEnvelope<AiLabRunChunkData>

/** Subscription target of a {@link SubscribeAiLabRunSocketIoPayload}. */
export interface SubscribeAiLabRunData {
    /** The run to subscribe to (joins room `ai-lab-run:{runId}`). */
    runId: string
}

/** Client → server payload to subscribe to a run's token stream. */
export interface SubscribeAiLabRunSocketIoPayload {
    /** The run to subscribe to. */
    data: SubscribeAiLabRunData
    /** Locale used for server-rendered status copy. */
    locale: string
}

/** Subscription target of an {@link AbortAiLabRunSocketIoPayload}. */
export interface AbortAiLabRunData {
    /** The run to abort. */
    runId: string
}

/** Client → server payload to abort an in-flight run. */
export interface AbortAiLabRunSocketIoPayload {
    /** The run to abort. */
    data: AbortAiLabRunData
    /** Locale used for server-rendered status copy. */
    locale: string
}
