import { useCallback, useEffect, useRef } from "react"
import { useLocale } from "next-intl"
import type {
    AbortContentAiSocketIoPayload,
    AskContentAiSocketIoPayload,
    ContentAiChunkSocketIoMessage,
    ContentAiHistoryTurn,
} from "./types"
import { PublicationEvent, SubscriptionEvent } from "./enums"
import { contentAiSocket } from "./sockets"

/** Args for one streamed content-AI question. */
export interface AskContentAiStreamParams {
    /** Conversation (session) this turn belongs to — the saved turn is keyed by it. */
    sessionId: string
    /** Content the question is grounded on. */
    contentId: string
    /** The learner's question. */
    question: string
    /** Recent prior turns (oldest first) for short-term memory. */
    history: Array<ContentAiHistoryTurn>
    /** Lane: "auto" (free chain) or "premium" (pin the chosen model). */
    mode?: string
    /** Pinned model name (only with mode "premium"). */
    model?: string | null
    /** Provider of the pinned model. */
    provider?: string | null
    /** Called for every incremental token delta as the answer streams. */
    onDelta: (delta: string) => void
    /** Called once when the stream finishes (with `error` set when it failed). */
    onDone: (error?: string) => void
}

/** What {@link useContentAiStream} returns to the chat component. */
export interface ContentAiStreamControls {
    /** Emit a question and stream its answer back through the supplied callbacks. */
    ask: (params: AskContentAiStreamParams) => void
    /** Abort the current in-flight answer stream (no-op when nothing is streaming). */
    abort: () => void
}

/**
 * Consumer hook for content-AI answer streaming over the singleton `/content_ai`
 * socket (connection owned by {@link import("./useContentAiSocketIoLifecycle").useContentAiSocketIoLifecycle}).
 *
 * `ask` emits the question and registers the active stream; the chunk listener
 * routes deltas for the matching `streamId` to the caller's `onDelta` and fires
 * `onDone` on the terminal chunk. Only one stream is tracked at a time.
 *
 * @returns `ask` / `abort` emitters bound to the active stream.
 */
export const useContentAiStream = (): ContentAiStreamControls => {
    const locale = useLocale()

    /** The active stream's id + callbacks, or `null` when nothing is streaming. */
    const activeRef = useRef<{
        streamId: string
        onDelta: (delta: string) => void
        onDone: (error?: string) => void
            } | null>(null)

    // route incoming chunks to the active stream's callbacks (one listener for
    // the socket's lifetime; matches by streamId so stale chunks are ignored)
    useEffect(() => {
        const onChunk = (message: ContentAiChunkSocketIoMessage) => {
            const data = message.data
            const active = activeRef.current
            if (!data || !active || data.streamId !== active.streamId) {
                return
            }
            if (data.delta) {
                active.onDelta(data.delta)
            }
            if (data.done) {
                active.onDone(data.error)
                activeRef.current = null
            }
        }
        contentAiSocket.on(SubscriptionEvent.ContentAiChunk, onChunk)
        return () => {
            contentAiSocket.off(SubscriptionEvent.ContentAiChunk, onChunk)
        }
    }, [])

    const ask = useCallback(
        (params: AskContentAiStreamParams) => {
            const streamId = crypto.randomUUID()
            activeRef.current = {
                streamId,
                onDelta: params.onDelta,
                onDone: params.onDone,
            }
            const payload: AskContentAiSocketIoPayload = {
                data: {
                    streamId,
                    sessionId: params.sessionId,
                    contentId: params.contentId,
                    question: params.question,
                    history: params.history,
                    mode: params.mode,
                    model: params.model,
                    provider: params.provider,
                },
                locale,
            }
            contentAiSocket.emit(PublicationEvent.AskContentAi, payload)
        },
        [locale],
    )

    const abort = useCallback(() => {
        const active = activeRef.current
        if (!active) {
            return
        }
        const payload: AbortContentAiSocketIoPayload = {
            data: { streamId: active.streamId },
            locale,
        }
        contentAiSocket.emit(PublicationEvent.AbortContentAi, payload)
        activeRef.current = null
    }, [locale])

    return {
        ask,
        abort,
    }
}
