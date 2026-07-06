import { restRequest } from "@/modules/api/rest/client"
import type {
    IntegrationApiKeyView,
    IntegrationConnectionView,
    IntegrationCreateApiKeyRequest,
    IntegrationCreateConnectionRequest,
    IntegrationCreatedKeyView,
    IntegrationUpdateConnectionRequest,
} from "./types"

// ---------------- ApiKeyController ----------------

export const listIntegrationApiKeys = async (): Promise<
    IntegrationApiKeyView[]
> =>
    restRequest<IntegrationApiKeyView[]>({
        method: "GET",
        url: "/integration/api-keys",
        authenticated: true,
    })

export const createIntegrationApiKey = async (
    request: IntegrationCreateApiKeyRequest,
): Promise<IntegrationCreatedKeyView> =>
    restRequest<IntegrationCreatedKeyView>({
        method: "POST",
        url: "/integration/api-keys",
        data: request,
    })

export const revokeIntegrationApiKey = async (id: string): Promise<boolean> =>
    restRequest<boolean>({
        method: "POST",
        url: `/integration/api-keys/${id}/revoke`,
    })

// ---------------- ConnectionController ----------------

export const listIntegrationConnections = async (request?: {
    category?: string
    status?: string
}): Promise<IntegrationConnectionView[]> =>
    restRequest<IntegrationConnectionView[]>({
        method: "GET",
        url: "/integration/connections",
        params: {
            category: request?.category,
            status: request?.status,
        },
        authenticated: true,
    })

export const getIntegrationConnection = async (
    id: string,
): Promise<IntegrationConnectionView> =>
    restRequest<IntegrationConnectionView>({
        method: "GET",
        url: `/integration/connections/${id}`,
        authenticated: true,
    })

export const createIntegrationConnection = async (
    request: IntegrationCreateConnectionRequest,
): Promise<IntegrationConnectionView> =>
    restRequest<IntegrationConnectionView>({
        method: "POST",
        url: "/integration/connections",
        data: request,
    })

export const updateIntegrationConnection = async (
    id: string,
    request: IntegrationUpdateConnectionRequest,
): Promise<IntegrationConnectionView> =>
    restRequest<IntegrationConnectionView>({
        method: "PATCH",
        url: `/integration/connections/${id}`,
        data: request,
    })
