"use client"

import { useRealtimeStompLifecycle } from "./useRealtimeStompLifecycle"

/**
 * Mounts the realtime connection lifecycle ONCE for the app tree. Renders `null` (childless) so its
 * re-renders never cascade.
 *
 * Realtime transport (WS-01): the BE speaks Spring STOMP (`/ws/chat`), NOT socket.io. One STOMP
 * connection ({@link useRealtimeStompLifecycle}) now carries chat AND notification realtime. The
 * remaining socket.io namespaces (content_discussion, ai_lab) have NO server yet; AI tutor streaming
 * uses SSE directly (not this connection). So the old socket.io lifecycles stay unmounted — see
 * OpenSpec change `realtime-transport-decision` (FTES-AOS-Backend).
 * @returns `null` — only runs the lifecycle hooks for their side effects.
 */
export const SocketIoSideEffects = () => {
    useRealtimeStompLifecycle()
    return null
}
