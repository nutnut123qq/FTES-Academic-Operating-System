"use client"

import { useCommunityChatStompLifecycle } from "./useCommunityChatStompLifecycle"

/**
 * Mounts the realtime connection lifecycle ONCE for the app tree. Renders `null` (childless) so its
 * re-renders never cascade.
 *
 * Realtime transport (WS-01): the BE speaks Spring STOMP (`/ws/chat`), NOT socket.io. Chat is now
 * wired over STOMP via {@link useCommunityChatStompLifecycle}. The other four socket.io namespaces
 * (job_notifications, content_discussion, ai_lab, content_ai) have NO server yet, so mounting them
 * only spun failing reconnect loops and kept the global "disconnected" banner permanently up. They
 * are intentionally NOT mounted, pending the transport decision — see OpenSpec change
 * `realtime-transport-decision` (FTES-AOS-Backend). Re-enable once their STOMP/SSE endpoints exist.
 * @returns `null` — only runs the lifecycle hooks for their side effects.
 */
export const SocketIoSideEffects = () => {
    useCommunityChatStompLifecycle()
    return null
}
