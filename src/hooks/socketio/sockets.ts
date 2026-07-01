import { createManager } from "./utils"
import type { Socket } from "socket.io-client"

/**
 * Module-level singleton Socket.IO instances (created once on import, `autoConnect: false`).
 *
 * The socket.io client is itself a singleton — like SWR's keyed cache — so there is no need for a
 * React context/provider. The connection lifecycle (connect on auth, listeners, dispatch to Redux)
 * runs ONCE in {@link SocketIoSideEffects}; consumers get the socket via the accessor hooks just to
 * `.emit()`. Separate managers keep one connection per namespace, matching the previous behavior.
 */
const jobNotificationsManager = createManager()
/** The `/job_notifications` namespace socket. */
export const jobNotificationsSocket: Socket = jobNotificationsManager.socket("/job_notifications")

const contentDiscussionManager = createManager()
/** The `/content_discussion` namespace socket. */
export const contentDiscussionSocket: Socket = contentDiscussionManager.socket("/content_discussion")

const aiLabManager = createManager()
/** The `/ai_lab` namespace socket (playground prompt token streaming). */
export const aiLabSocket: Socket = aiLabManager.socket("/ai_lab")

const communityChatManager = createManager()
/** The `/community_chat` namespace socket (per-conversation message realtime). */
export const communityChatSocket: Socket = communityChatManager.socket("/community_chat")

const contentAiManager = createManager()
/** The `/content_ai` namespace socket (grounded lesson Q&A answer token streaming). */
export const contentAiSocket: Socket = contentAiManager.socket("/content_ai")
