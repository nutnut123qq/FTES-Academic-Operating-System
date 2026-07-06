/**
 * Request/response DTOs for the integration REST controllers.
 *
 * Mirrors the backend records in `vn.ftes.aos.integration.web.ApiKeyController` and
 * `vn.ftes.aos.integration.web.ConnectionController`.
 *
 * All exported names are prefixed with `Integration` to avoid collisions in the
 * shared `src/modules/api/rest/index.ts` barrel.
 */

// ---------------- ApiKeyController ----------------

export interface IntegrationApiKeyView {
    id: string
    name: string
    keyPrefix: string
    scopes: string[]
    status: string
    rateLimitPerMinute: number
}

export interface IntegrationCreateApiKeyRequest {
    name: string
    scopes: string[]
    rateLimitPerMinute: number
    ownerRef?: string
}

export interface IntegrationCreatedKeyView {
    id: string
    plaintext: string
    keyPrefix: string
    scopes: string[]
}

// ---------------- ConnectionController ----------------

export interface IntegrationConnectionView {
    id: string
    category: string
    provider: string
    name: string
    config: string
    status: string
    lastHealthStatus: string
}

export interface IntegrationCreateConnectionRequest {
    category: string
    provider: string
    name: string
    config: string
    credentials: string
}

export interface IntegrationUpdateConnectionRequest {
    config?: string
    credentials?: string
    status?: string
}
