import { useEffect } from "react"
import type { AiLabRunChunkSocketIoMessage } from "./types"
import { SubscriptionEvent } from "./enums"
import { aiLabSocket } from "./sockets"
import { useSocketConnectionStore } from "./connectionStore"
import { useAppDispatch, useAppSelector } from "@/redux/hooks"
import { appendAiLabRunChunk } from "@/redux/slices/socketio"
import { LocalStorage } from "@/modules/storage/local/storage"
import { LocalStorageId } from "@/modules/storage/local/enums/id"

/**
 * Lifecycle hook for the `/ai_lab` namespace — runs ONCE in {@link SocketIoSideEffects}.
 * Auto-connects on auth (same bearer-token handshake + reconnect backoff as the other
 * namespaces), listens for streamed run chunks, and accumulates each delta into Redux
 * (`socketIo.aiLabRunById`). Consumers do NOT call this; they use `useAiLabSocketIo` to get
 * the singleton socket and `.emit()` subscribe/abort, and read accumulated state from Redux.
 */
export const useAiLabSocketIoLifecycle = () => {
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const dispatch = useAppDispatch()

    /** Wire connect / disconnect / chunk listeners and merge chunks into Redux. */
    useEffect(() => {
        const socket = aiLabSocket
        const onConnect = () => {
            console.log("[AI Lab Socket] Connected.")
            useSocketConnectionStore.getState().setStatus("ai_lab", "connected")
        }
        const onChunk = (message: AiLabRunChunkSocketIoMessage) => {
            const data = message.data
            if (!data?.runId) {
                return
            }
            dispatch(appendAiLabRunChunk({ message: data }))
        }
        const onDisconnect = (reason: string) => {
            console.log(`[AI Lab Socket] Disconnected — reason: ${reason}`)
            useSocketConnectionStore.getState().setStatus("ai_lab", "disconnected")
        }
        const onConnectError = (err: Error) => {
            console.error("[AI Lab Socket] Connection error:", err.message)
            useSocketConnectionStore.getState().setStatus("ai_lab", "disconnected")
        }
        socket.on("connect", onConnect)
        socket.on(SubscriptionEvent.AiLabRunChunk, onChunk)
        socket.on("disconnect", onDisconnect)
        socket.on("connect_error", onConnectError)
        return () => {
            socket.off("connect", onConnect)
            socket.off(SubscriptionEvent.AiLabRunChunk, onChunk)
            socket.off("disconnect", onDisconnect)
            socket.off("connect_error", onConnectError)
        }
    }, [dispatch])

    /** Connect (or reconnect) when auth state changes. */
    useEffect(() => {
        if (!authenticated) {
            return
        }
        if (aiLabSocket.connected) {
            aiLabSocket.disconnect()
        }
        aiLabSocket.auth = (cb) => cb({
            token: LocalStorage.getItemAsString(
                LocalStorageId.KeycloakAccessToken,
            ),
        })
        aiLabSocket.connect()
    }, [authenticated])
}
