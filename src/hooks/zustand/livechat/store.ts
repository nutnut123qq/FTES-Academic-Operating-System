"use client"

import { create } from "zustand"
import type { LiveChatMessage } from "@/modules/api/rest/livechat"

/**
 * Backpressure cap: the live thread keeps at most this many recent messages in
 * memory (oldest dropped first). Chat is ephemeral — history beyond this is the
 * ring buffer's job, not the client's.
 */
export const LIVE_CHAT_STORE_CAP = 100

/**
 * Merge new rows into an existing list: dedupe by `id` (the SSE echo of a message
 * the sender optimistically appended carries the SAME id), keep ascending `ts`
 * order, and cap at {@link LIVE_CHAT_STORE_CAP} (drop the oldest).
 */
const mergeMessages = (
    existing: Array<LiveChatMessage>,
    incoming: ReadonlyArray<LiveChatMessage>,
): Array<LiveChatMessage> => {
    const byId = new Map<string, LiveChatMessage>()
    for (const message of existing) {
        byId.set(message.id, message)
    }
    for (const message of incoming) {
        byId.set(message.id, message)
    }
    const merged = Array.from(byId.values()).sort((a, b) => a.ts - b.ts)
    return merged.length > LIVE_CHAT_STORE_CAP
        ? merged.slice(merged.length - LIVE_CHAT_STORE_CAP)
        : merged
}

/**
 * Client VIEW CACHE for the community live-chat thread. The messages are OWNED by
 * the backend Redis ring buffer + pub/sub fan-out — this store only holds the SPA
 * session's live, merged view so the SSE stream ({@link import("@/hooks/sse/useCommunityLiveChatSse").useCommunityLiveChatSse}),
 * the `GET /recent` seed and the optimistic send all write to ONE list the panel
 * renders from. Online COUNTS live in the SWR cache (patched by the SSE `online`
 * event), not here — this store is messages only.
 */
interface LiveChatStoreState {
    /** The live thread, ascending by `ts`, capped at {@link LIVE_CHAT_STORE_CAP}. */
    messages: Array<LiveChatMessage>
    /** Seed the thread from `GET /recent` — MERGES (never clobbers live rows already appended). */
    seedMessages: (messages: ReadonlyArray<LiveChatMessage>) => void
    /** Append one message (SSE push or optimistic send); deduped by id. */
    appendMessage: (message: LiveChatMessage) => void
    /** Drop a message by id (used to remove an optimistic temp row on send failure). */
    removeMessage: (id: string) => void
    /** Clear the thread (not currently wired — kept for an explicit teardown). */
    clear: () => void
}

export const useLiveChatStore = create<LiveChatStoreState>((set) => ({
    messages: [],
    seedMessages: (messages) =>
        set((state) => ({ messages: mergeMessages(state.messages, messages) })),
    appendMessage: (message) =>
        set((state) => ({ messages: mergeMessages(state.messages, [message]) })),
    removeMessage: (id) =>
        set((state) => ({ messages: state.messages.filter((message) => message.id !== id) })),
    clear: () => set({ messages: [] }),
}))
