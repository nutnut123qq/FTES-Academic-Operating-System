"use client"

import useSWR from "swr"
import {
    getIntegrationConnection,
    type IntegrationConnectionView,
} from "@/modules/api/rest/integration"

/**
 * SWR query wrapper for {@link getIntegrationConnection}.
 */
export const useGetIntegrationConnectionSwr = (id: string) => {
    const swr = useSWR<IntegrationConnectionView, Error>(
        ["GET_INTEGRATION_CONNECTION_SWR", id],
        () => getIntegrationConnection(id),
    )

    return swr
}
