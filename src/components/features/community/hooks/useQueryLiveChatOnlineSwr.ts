"use client"

import useSWR from "swr"
import { getLiveChatOnline } from "@/modules/api/rest/livechat"
import type { LiveChatOnline } from "@/modules/api/rest/livechat"

/**
 * SWR cache key for the live-chat online counts. The SSE lifecycle hook patches
 * THIS key directly (`mutate(key, online, { revalidate: false })`) on every `online`
 * event — the count IS the data, no refetch — so every consumer stays live. Shared
 * so the patcher and the reader never drift.
 */
export const LIVE_CHAT_ONLINE_SWR_KEY: Array<string> = ["LIVECHAT_ONLINE"]

/**
 * Reads the community live-chat online counts (`GET /online`). Serves the initial /
 * fallback value; after the SSE stream connects, its throttled `online` events patch
 * this same cache in place. Gated by `enabled` (the panel-open + authenticated
 * signal) so it never fetches while the panel is closed.
 *
 * @param enabled - Whether the panel is open (and the viewer authenticated).
 */
export const useQueryLiveChatOnlineSwr = (enabled: boolean) => {
    const { data, isLoading, error } = useSWR(
        enabled ? LIVE_CHAT_ONLINE_SWR_KEY : null,
        (): Promise<LiveChatOnline> => getLiveChatOnline(),
        {
            // The SSE `online` event is the freshness source; a slow poll only backstops it.
            refreshInterval: 30_000,
            revalidateOnFocus: false,
        },
    )
    return {
        online: data ?? null,
        isLoading,
        error,
    }
}
