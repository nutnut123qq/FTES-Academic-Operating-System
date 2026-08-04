"use client"

import { useEffect } from "react"
import useSWR from "swr"
import {
    LIVE_CHAT_RECENT_LIMIT,
    getLiveChatRecent,
} from "@/modules/api/rest/livechat"
import type { LiveChatMessage } from "@/modules/api/rest/livechat"
import { useLiveChatStore } from "@/hooks/zustand/livechat/store"

/** SWR cache key for the recent-messages seed. */
export const LIVE_CHAT_RECENT_SWR_KEY: Array<string> = ["LIVECHAT_RECENT"]

/**
 * Loads the recent ring-buffer messages (`GET /recent?limit=30`) that SEED the live
 * thread when the panel opens, then MERGES them into the zustand store (so live
 * messages that raced in from the SSE stream are preserved, not clobbered). After the
 * seed, the SSE stream owns new messages — this query does not poll. Gated by
 * `enabled` (panel-open + authenticated) so it never fetches while the panel is closed.
 *
 * The panel renders from the store (the live, merged list); this hook's `isLoading`
 * / `error` drive the AsyncContent skeleton on the FIRST paint only.
 *
 * @param enabled - Whether the panel is open (and the viewer authenticated).
 */
export const useQueryLiveChatRecentSwr = (enabled: boolean) => {
    const seedMessages = useLiveChatStore((state) => state.seedMessages)
    const { data, isLoading, error } = useSWR(
        enabled ? LIVE_CHAT_RECENT_SWR_KEY : null,
        (): Promise<Array<LiveChatMessage>> => getLiveChatRecent(LIVE_CHAT_RECENT_LIMIT),
        { revalidateOnFocus: false },
    )

    // Merge the seed into the live store whenever a fresh page arrives (idempotent —
    // dedupe by id keeps the SSE-delivered rows intact).
    useEffect(() => {
        if (data) {
            seedMessages(data)
        }
    }, [data, seedMessages])

    return { isLoading, error, seeded: !!data }
}
