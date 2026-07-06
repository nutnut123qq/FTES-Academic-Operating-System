"use client"

import useSWR from "swr"
import {
    listPlatformAiProviders,
    type PlatformAiProvider,
} from "@/modules/api/rest/platform"

/**
 * SWR query wrapper for {@link listPlatformAiProviders}.
 */
export const useGetPlatformAiProvidersSwr = () => {
    const swr = useSWR<PlatformAiProvider[], Error>(
        "GET_PLATFORM_AI_PROVIDERS_SWR",
        () => listPlatformAiProviders(),
    )

    return swr
}
