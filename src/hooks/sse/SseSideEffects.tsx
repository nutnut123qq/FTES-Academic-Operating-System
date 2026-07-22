"use client"

import { useNotificationSseLifecycle } from "./useNotificationSseLifecycle"

/**
 * Mounts the app-wide SSE lifecycles ONCE for the app tree. Renders `null` (childless) so its
 * re-renders never cascade.
 *
 * Realtime transport (post-reversal): the BE deleted its STOMP/WebSocket layer in commit
 * `3ea3527` (OpenSpec `realtime-transport-decision`, FTES-AOS-Backend), so the only realtime
 * channel is the notifications SSE stream ({@link useNotificationSseLifecycle}). Chat stays
 * REST persist/history with no realtime push (a future change may bring it back); AI tutor
 * token streaming uses its own per-request SSE (`sendSessionMessageStream`), not this mount.
 * @returns `null` — only runs the lifecycle hooks for their side effects.
 */
export const SseSideEffects = () => {
    useNotificationSseLifecycle()
    return null
}
