"use client"

import useSWR from "swr"
import {
    listPlatformFeatureFlags,
    type PlatformFeatureFlag,
} from "@/modules/api/rest/platform"

/**
 * SWR query wrapper for {@link listPlatformFeatureFlags}.
 */
export const useGetPlatformFeatureFlagsSwr = () => {
    const swr = useSWR<PlatformFeatureFlag[], Error>(
        "GET_PLATFORM_FEATURE_FLAGS_SWR",
        () => listPlatformFeatureFlags(),
    )

    return swr
}
