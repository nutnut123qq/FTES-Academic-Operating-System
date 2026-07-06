"use client"

import useSWR from "swr"
import {
    evaluatePlatformFeatureFlag,
    type PlatformFeatureFlagEvaluation,
} from "@/modules/api/rest/platform"

/**
 * SWR query wrapper for {@link evaluatePlatformFeatureFlag}.
 */
export const useGetPlatformFeatureFlagSwr = (key: string) => {
    const swr = useSWR<PlatformFeatureFlagEvaluation, Error>(
        ["GET_PLATFORM_FEATURE_FLAG_SWR", key],
        () => evaluatePlatformFeatureFlag(key),
    )

    return swr
}
