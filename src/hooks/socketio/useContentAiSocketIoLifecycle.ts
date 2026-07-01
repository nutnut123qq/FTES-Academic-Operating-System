import { useEffect } from "react"
import { useAppSelector } from "@/redux/hooks"
import { contentAiSocket } from "./sockets"
import { useSocketConnectionStore } from "./connectionStore"
import { LocalStorage } from "@/modules/storage/local/storage"
import { LocalStorageId } from "@/modules/storage/local/enums/id"

/**
 * Lifecycle hook for the `/content_ai` namespace — runs ONCE in
 * {@link import("./SocketIoSideEffects").SocketIoSideEffects}. Connects on auth
 * and relies on the manager's built-in reconnection (infinite backoff) to come
 * back after a drop; the bearer token is supplied per-attempt via a function
 * `socket.auth` so every reconnect carries a FRESH token. Answer-chunk listeners
 * are attached per-stream by consumers via
 * {@link import("./useContentAiStream").useContentAiStream}; this hook only owns
 * the connection.
 */
export const useContentAiSocketIoLifecycle = () => {
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)

    /** Wire connect / disconnect listeners (log only — reconnection is automatic). */
    useEffect(() => {
        const socket = contentAiSocket
        const onConnect = () => {
            console.log("[Content AI Socket] Connected.")
            useSocketConnectionStore.getState().setStatus("content_ai", "connected")
        }
        const onDisconnect = (reason: string) => {
            console.log(`[Content AI Socket] Disconnected — reason: ${reason}`)
            useSocketConnectionStore.getState().setStatus("content_ai", "disconnected")
        }
        const onConnectError = (err: Error) => {
            console.error("[Content AI Socket] Connection error:", err.message)
            useSocketConnectionStore.getState().setStatus("content_ai", "disconnected")
        }
        socket.on("connect", onConnect)
        socket.on("disconnect", onDisconnect)
        socket.on("connect_error", onConnectError)
        return () => {
            socket.off("connect", onConnect)
            socket.off("disconnect", onDisconnect)
            socket.off("connect_error", onConnectError)
        }
    }, [])

    /** Connect when auth state changes; the manager auto-reconnects thereafter. */
    useEffect(() => {
        if (!authenticated) {
            return
        }
        if (contentAiSocket.connected) {
            contentAiSocket.disconnect()
        }
        // function form → re-evaluated on every (re)connection attempt, so a
        // reconnect after the token rotated still handshakes with a fresh token
        contentAiSocket.auth = (cb) => cb({
            token: LocalStorage.getItemAsString(
                LocalStorageId.KeycloakAccessToken,
            ),
        })
        contentAiSocket.connect()
    }, [authenticated])
}
