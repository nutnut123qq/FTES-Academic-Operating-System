"use client"

import useSWR from "swr"
import { getMyAiQuota } from "@/modules/api/rest/ai"

/**
 * The viewer's AI quota — per-feature remaining calls TODAY, as reported by
 * `GET /ai/quotas/me` (BE `QuotaController`: `Map<AiFeature, remainingDay>`).
 * The BE has no windowed credit pool (5h/week) nor paid tiers — that earlier
 * mock concept is gone; the sidebar headlines the tutor-chat feature.
 */
export interface AiQuota {
    /** Remaining calls today keyed by BE `AiFeature` name (e.g. `TUTOR_CHAT`). */
    byFeature: Record<string, number>
    /** Remaining `TUTOR_CHAT` calls today — the headline sidebar number. */
    chatRemainingToday: number
}

/** Loads the viewer's per-feature daily AI quota from the real AI REST API. */
export const useQueryAiQuotaSwr = () => {
    const { data, isLoading, error, mutate } = useSWR(
        ["analytics", "overview", "aiQuota"],
        async (): Promise<AiQuota> => {
            const byFeature = await getMyAiQuota()
            return {
                byFeature,
                chatRemainingToday: byFeature.TUTOR_CHAT ?? 0,
            }
        },
    )
    return { data, isLoading, error, mutate }
}
