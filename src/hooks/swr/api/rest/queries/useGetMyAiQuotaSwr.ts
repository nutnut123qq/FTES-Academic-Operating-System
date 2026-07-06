"use client"

import useSWR from "swr"
import { getMyAiQuota } from "@/modules/api/rest/ai"

/**
 * SWR query wrapper for {@link getMyAiQuota}.
 */
export const useGetMyAiQuotaSwr = () => {
    const swr = useSWR<Record<string, number>, Error>(
        ["GET_MY_AI_QUOTA_SWR"],
        () => getMyAiQuota(),
    )

    return swr
}
