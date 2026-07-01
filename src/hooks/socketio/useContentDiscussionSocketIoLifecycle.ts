import { useEffect } from "react"
import EventEmitter2 from "eventemitter2"
import { SubscriptionEvent } from "./enums"
import { contentDiscussionSocket } from "./sockets"
import { useSocketConnectionStore } from "./connectionStore"
import { useAppSelector } from "@/redux/hooks"
import { LocalStorage } from "@/modules/storage/local/storage"
import { LocalStorageId } from "@/modules/storage/local/enums/id"

/** Fan-out for content-discussion events to (non-Redux) component listeners. */
export const contentDiscussionSocketIoEventEmitter = new EventEmitter2()

/** The five server → client discussion events this socket forwards to the emitter. */
const FORWARDED_EVENTS: ReadonlyArray<SubscriptionEvent> = [
    SubscriptionEvent.CommentCreated,
    SubscriptionEvent.CommentUpdated,
    SubscriptionEvent.CommentDeleted,
    SubscriptionEvent.ContentReactionChanged,
    SubscriptionEvent.CommentReactionChanged,
]

/**
 * Lifecycle hook for the `/content_discussion` namespace — runs ONCE in {@link SocketIoSideEffects}.
 * Auto-connects on auth and fans every discussion event out via
 * {@link contentDiscussionSocketIoEventEmitter} so the per-content UI can refetch. Room
 * subscription is done by the consuming component (per content id) via the accessor socket.
 */
export const useContentDiscussionSocketIoLifecycle = () => {
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)

    /** Wire connect / disconnect / event listeners that forward to the emitter. */
    useEffect(() => {
        const socket = contentDiscussionSocket
        const onConnect = () => {
            console.log("[Content discussion Socket] Connected.")
            useSocketConnectionStore.getState().setStatus("content_discussion", "connected")
        }
        // one forwarding handler per event so the UI can listen on the emitter
        const handlers = FORWARDED_EVENTS.map((event) => {
            const handler = (message: unknown) => {
                contentDiscussionSocketIoEventEmitter.emit(event, message)
            }
            socket.on(event, handler)
            return {
                event,
                handler,
            }
        })
        const onDisconnect = (reason: string) => {
            console.log(`[Content discussion Socket] Disconnected — reason: ${reason}`)
            useSocketConnectionStore.getState().setStatus("content_discussion", "disconnected")
        }
        const onConnectError = (err: Error) => {
            console.error("[Content discussion Socket] Connection error:", err.message)
            useSocketConnectionStore.getState().setStatus("content_discussion", "disconnected")
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
        if (contentDiscussionSocket.connected) {
            contentDiscussionSocket.disconnect()
        }
        contentDiscussionSocket.auth = (cb) => cb({
            token: LocalStorage.getItemAsString(
                LocalStorageId.KeycloakAccessToken,
            ),
        })
        contentDiscussionSocket.connect()
    }, [authenticated])
}
