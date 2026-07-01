import { useCallback } from "react"
import { useLocale } from "next-intl"
import type {
    AbortAiLabRunSocketIoPayload,
    SubscribeAiLabRunSocketIoPayload,
} from "./types"
import { PublicationEvent } from "./enums"
import { aiLabSocket } from "./sockets"
import { useAppDispatch, useAppSelector } from "@/redux/hooks"
import { resetAiLabRun, startAiLabRun, type AiLabRunStreamState } from "@/redux/slices/socketio"

/** What {@link useAiLabRunStreamSocketIo} returns to a playground component. */
export interface AiLabRunStreamControls {
    /** Accumulated streaming state for the tracked run, or `undefined` before it starts. */
    run?: AiLabRunStreamState
    /**
     * Begin tracking a run: seed Redux state and emit `SubscribeAiLabRun` so the server
     * streams chunks for `ai-lab-run:{runId}`. Skip this for cache hits (status `cached`).
     */
    subscribe: (runId: string) => void
    /** Emit `AbortAiLabRun` to stop an in-flight run. */
    abort: (runId: string) => void
    /** Drop a run's accumulated state (re-run or reset-to-default). */
    reset: (runId: string) => void
}

/**
 * Consumer hook for AI Lab playground token streaming. Reads the accumulated stream state
 * for `runId` directly from the Redux `socketIo.aiLabRunById` map (no prop-drilling), and
 * exposes `subscribe` / `abort` / `reset` that emit on the singleton `/ai_lab` socket.
 * The connection + chunk-accumulation lifecycle is owned by {@link SocketIoSideEffects}.
 * @param runId the run to read state for (pass `undefined` before a run exists).
 * @returns the run's stream state plus subscribe/abort/reset emitters.
 */
export const useAiLabRunStreamSocketIo = (
    runId?: string,
): AiLabRunStreamControls => {
    const dispatch = useAppDispatch()
    const locale = useLocale()
    const run = useAppSelector((state) =>
        runId ? state.socketIo.aiLabRunById[runId] : undefined,
    )

    const subscribe = useCallback(
        (id: string) => {
            dispatch(startAiLabRun({ runId: id }))
            const payload: SubscribeAiLabRunSocketIoPayload = {
                data: { runId: id },
                locale,
            }
            aiLabSocket.emit(PublicationEvent.SubscribeAiLabRun, payload)
        },
        [dispatch, locale],
    )

    const abort = useCallback(
        (id: string) => {
            const payload: AbortAiLabRunSocketIoPayload = {
                data: { runId: id },
                locale,
            }
            aiLabSocket.emit(PublicationEvent.AbortAiLabRun, payload)
        },
        [locale],
    )

    const reset = useCallback(
        (id: string) => {
            dispatch(resetAiLabRun({ runId: id }))
        },
        [dispatch],
    )

    return {
        run,
        subscribe,
        abort,
        reset,
    }
}
