"use client"

import useSWR from "swr"
import {
    listIntegrationConnections,
    type IntegrationConnectionView,
} from "@/modules/api/rest/integration"

/**
 * SWR query wrapper for {@link listIntegrationConnections}.
 */
export const useGetIntegrationConnectionsSwr = (request?: {
    category?: string
    status?: string
}) => {
    const swr = useSWR<IntegrationConnectionView[], Error>(
        ["GET_INTEGRATION_CONNECTIONS_SWR", request],
        () => listIntegrationConnections(request),
    )

    return swr
}
