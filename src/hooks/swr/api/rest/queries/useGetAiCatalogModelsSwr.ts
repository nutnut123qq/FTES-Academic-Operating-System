"use client"

import useSWR from "swr"
import { listAiCatalogModels } from "@/modules/api/rest/ai"
import type { AiModelCatalog } from "@/modules/api/rest/ai"

/**
 * SWR query wrapper for {@link listAiCatalogModels} (`GET /api/v1/ai/models`).
 *
 * The catalog is near-static → cached 30 minutes (dedupe) and not revalidated
 * on focus. Named "catalog" to stay distinct from the admin per-feature
 * model-config hook (`useGetModelConfigsSwr`).
 */
export const useGetAiCatalogModelsSwr = () => {
    const swr = useSWR<AiModelCatalog, Error>(
        ["GET_AI_CATALOG_MODELS_SWR"],
        () => listAiCatalogModels(),
        {
            dedupingInterval: 30 * 60 * 1000,
            revalidateOnFocus: false,
        },
    )

    return swr
}
