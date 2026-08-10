"use client"

import { useCallback } from "react"
import { useAppSelector } from "@/redux/hooks"
import { sendLiveChatMessage } from "@/modules/api/rest/livechat"
import type { LiveChatMessage, LiveChatReplyTo } from "@/modules/api/rest/livechat"
import { useLiveChatStore } from "@/hooks/zustand/livechat/store"

/** Client-side id for an optimistic message pending its server row. */
const tempId = (): string =>
    `temp-${typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : String(Date.now())}`

/**
 * Sends a live-chat message with OPTIMISTIC append: the sender's bubble shows
 * immediately (a temp row keyed by a client id), then the real server row replaces
 * it on success. The SSE fan-out echoes the same server id back to the sender, which
 * the store dedupes — so the message never appears twice. On failure the temp row is
 * rolled back and `send` resolves `false` (the caller restores the input + toasts).
 *
 * An optional `replyTo` quote (FE-built, ephemeral) rides along on the optimistic row
 * and the POST, so the reply preview renders instantly and survives the SSE echo.
 *
 * @returns `send(text, replyTo?)` → `true` on success, `false` on empty/unauthenticated/failure.
 */
export const useMutateSendLiveChatSwr = () => {
    const viewer = useAppSelector((state) => state.user.user)
    const appendMessage = useLiveChatStore((state) => state.appendMessage)
    const removeMessage = useLiveChatStore((state) => state.removeMessage)

    const send = useCallback(
        async (text: string, replyTo?: LiveChatReplyTo | null): Promise<boolean> => {
            const trimmed = text.trim()
            if (!trimmed || !viewer) {
                return false
            }

            const optimistic: LiveChatMessage = {
                id: tempId(),
                userId: viewer.id,
                displayName: viewer.displayName ?? viewer.username,
                avatar: viewer.avatar ?? null,
                text: trimmed,
                ts: Date.now(),
                replyTo: replyTo ?? null,
            }
            appendMessage(optimistic)

            try {
                const saved = await sendLiveChatMessage({ text: trimmed, replyTo })
                removeMessage(optimistic.id)
                appendMessage(saved)
                return true
            } catch {
                removeMessage(optimistic.id)
                return false
            }
        },
        [viewer, appendMessage, removeMessage],
    )

    return { send }
}
