"use client"

import useSWR from "swr"
import { listModelConfigs, type ModelConfigView } from "@/modules/api/rest/ai"

/**
 * SWR query wrapper for {@link listModelConfigs}.
 */
export const useGetModelConfigsSwr = () => {
    const swr = useSWR<ModelConfigView[], Error>(
        ["GET_MODEL_CONFIGS_SWR"],
        () => listModelConfigs(),
    )

    return swr
}
