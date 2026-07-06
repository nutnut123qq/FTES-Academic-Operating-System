"use client"

import useSWR from "swr"
import {
    listIntegrationApiKeys,
    type IntegrationApiKeyView,
} from "@/modules/api/rest/integration"

/**
 * SWR query wrapper for {@link listIntegrationApiKeys}.
 */
export const useGetIntegrationApiKeysSwr = () => {
    const swr = useSWR<IntegrationApiKeyView[], Error>(
        "GET_INTEGRATION_API_KEYS_SWR",
        () => listIntegrationApiKeys(),
    )

    return swr
}
