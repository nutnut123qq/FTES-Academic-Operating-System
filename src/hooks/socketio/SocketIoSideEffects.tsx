"use client"

import { useAiLabSocketIoLifecycle } from "./useAiLabSocketIoLifecycle"
import { useCommunityChatSocketIoLifecycle } from "./useCommunityChatSocketIoLifecycle"
import { useContentAiSocketIoLifecycle } from "./useContentAiSocketIoLifecycle"
import { useContentDiscussionSocketIoLifecycle } from "./useContentDiscussionSocketIoLifecycle"
import { useJobNotificationsSocketIoLifecycle } from "./useJobNotificationsSocketIoLifecycle"

/**
 * Mounts the Socket.IO connection lifecycle ONCE for the app tree (replaces the old
 * `SocketIoProvider`/context). Runs the connect-on-auth, listener wiring, and Redux dispatch
 * effects for both namespaces; renders `null` (childless) so its re-renders never cascade.
 * Consumers get the singleton sockets via `useJobNotificationsSocketIo` / `useContentDiscussionSocketIo`.
 * @returns `null` — only runs the lifecycle hooks for their side effects.
 */
export const SocketIoSideEffects = () => {
    useJobNotificationsSocketIoLifecycle()
    useContentDiscussionSocketIoLifecycle()
    useAiLabSocketIoLifecycle()
    useCommunityChatSocketIoLifecycle()
    useContentAiSocketIoLifecycle()
    return null
}
