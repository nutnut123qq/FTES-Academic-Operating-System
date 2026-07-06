"use client"

import useSWR from "swr"
import { getAiInsights, type AiInsights } from "@/modules/api/rest/ai"

/**
 * SWR query wrapper for {@link getAiInsights}.
 */
export const useGetAiInsightsSwr = (days?: number) => {
    const swr = useSWR<AiInsights, Error>(
        ["GET_AI_INSIGHTS_SWR", days],
        () => getAiInsights(days),
    )

    return swr
}
