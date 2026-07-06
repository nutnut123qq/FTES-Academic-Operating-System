"use client"

import useSWR from "swr"
import {
    listPlatformConfigurations,
    type PlatformConfiguration,
} from "@/modules/api/rest/platform"

/**
 * SWR query wrapper for {@link listPlatformConfigurations}.
 */
export const useGetPlatformConfigurationsSwr = (request?: {
    scopeType?: string
    scopeId?: string
    prefix?: string
}) => {
    const swr = useSWR<PlatformConfiguration[], Error>(
        ["GET_PLATFORM_CONFIGURATIONS_SWR", request],
        () => listPlatformConfigurations(request),
    )

    return swr
}
