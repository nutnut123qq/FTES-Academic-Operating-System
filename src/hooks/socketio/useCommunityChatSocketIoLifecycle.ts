import { useEffect } from "react"
import EventEmitter2 from "eventemitter2"
import { SubscriptionEvent } from "./enums"
import { communityChatSocket } from "./sockets"
import { useSocketConnectionStore } from "./connectionStore"
import { useAppSelector } from "@/redux/hooks"
import { LocalStorage } from "@/modules/storage/local/storage"
import { LocalStorageId } from "@/modules/storage/local/enums/id"

/** Fan-out for community-chat events to (non-Redux) component listeners. */
export const communityChatSocketIoEventEmitter = new EventEmitter2()

/** The server → client chat events this socket forwards to the emitter. */
const FORWARDED_EVENTS: ReadonlyArray<SubscriptionEvent> = [
    SubscriptionEvent.ChatMessageCreated,
]

/**
 * Lifecycle hook for the `/community_chat` namespace — runs ONCE in
 * {@link SocketIoSideEffects}. Auto-connects on auth and fans every chat event out
 * via {@link communityChatSocketIoEventEmitter} so the open conversation can
 * refetch. Room subscription is done by the consuming component (per conversation
 * id) via the accessor socket.
 */
export const useCommunityChatSocketIoLifecycle = () => {
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)

    /** Wire connect / disconnect / event listeners that forward to the emitter. */
    useEffect(() => {
        const socket = communityChatSocket
        const onConnect = () => {
            console.log("[Community chat Socket] Connected.")
            useSocketConnectionStore.getState().setStatus("community_chat", "connected")
        }
        // one forwarding handler per event so the UI can listen on the emitter
        const handlers = FORWARDED_EVENTS.map((event) => {
            const handler = (message: unknown) => {
                communityChatSocketIoEventEmitter.emit(event, message)
            }
            socket.on(event, handler)
            return {
                event,
                handler,
            }
        })
        const onDisconnect = (reason: string) => {
            console.log(`[Community chat Socket] Disconnected — reason: ${reason}`)
            useSocketConnectionStore.getState().setStatus("community_chat", "disconnected")
        }
        const onConnectError = (err: Error) => {
            console.error("[Community chat Socket] Connection error:", err.message)
            useSocketConnectionStore.getState().setStatus("community_chat", "disconnected")
        }
        socket.on("connect", onConnect)
        socket.on("disconnect", onDisconnect)
        socket.on("connect_error", onConnectError)
        return () => {
            socket.off("connect", onConnect)
            socket.off("disconnect", onDisconnect)
            socket.off("connect_error", onConnectError)
            // detach every forwarding handler on cleanup
            handlers.forEach(({ event, handler }) => socket.off(event, handler))
        }
    }, [])

    /** Connect (or reconnect) when auth state changes. */
    useEffect(() => {
        // unauthenticated users have no token → skip connecting
        if (!authenticated) {
            return
        }
        // drop any stale connection before re-auth so the handshake carries a fresh token
        if (communityChatSocket.connected) {
            communityChatSocket.disconnect()
        }
        communityChatSocket.auth = (cb) => cb({
            token: LocalStorage.getItemAsString(
                LocalStorageId.KeycloakAccessToken,
            ),
        })
        communityChatSocket.connect()
    }, [authenticated])
}
