import { 
    ApolloClient, 
    ApolloLink, 
    InMemoryCache 
} from "@apollo/client"
import {
    createRetryLink,
    createErrorLink,
    createTimeoutLink,
    createAttachAccessTokenLink,
    createAttachCsrfTokenLink,
    createAttachDeviceFingerprintLink,
    createHttpLink,
    defaultOptions,
    createProactiveAccessTokenRefreshLink
} from "../links"
import { type GraphQLHeaders } from "../../types"
import { LocalStorage } from "@/modules/storage/local/storage"
import { LocalStorageId } from "@/modules/storage/local/enums/id"

/**
 * Authenticated Apollo client for GraphQL operations.
 *
 * ## Link execution order (`ApolloLink.from`: left → right = outer → inner pipeline)
 *
 * Each `Operation` flows through the link chain; `HttpLink` is always **terminal**
 * and performs the actual network request (`fetch`).
 *
 * ```text
 *     (SWR / component calls apollo.query|mutate)
 *                 │
 *                 ▼
 *   ┌─────────────────────────┐
 *   │ 1. RetryLink            │  Retries transient network failures (backoff + jitter).
 *   └───────────┬─────────────┘
 *               ▼
 *   ┌─────────────────────────┐
 *   │ 2. ErrorLink            │  Logs GraphQL / network / protocol errors from downstream.
 *   └───────────┬─────────────┘
 *               ▼
 *   ┌─────────────────────────┐
 *   │ 3. TimeoutLink          │  Aborts request if no response within `graphql.timeout` ms.
 *   └───────────┬─────────────┘
 *               ▼
 *   ┌─────────────────────────┐
 *   │ 4. AuthRefreshLink      │  If `UNAUTHENTICATED`, refresh token once and retry operation.
 *   └───────────┬─────────────┘
 *               ▼
 *   ┌─────────────────────────┐
 *   │ 5. ProactiveRefreshLink │  If JWT TTL < `minValiditySeconds`, refresh before request.
 *   └───────────┬─────────────┘
 *               ▼
 *   ┌─────────────────────────┐
 *   │ 6. AttachAccessTokenLink│  Attaches `Authorization: Bearer <JWT>` from LocalStorage.
 *   └───────────┬─────────────┘
 *               ▼
 *   ┌─────────────────────────┐
 *   │ 7. HttpLink             │  Executes GraphQL `POST` with `credentials` when enabled.
 *   └───────────┬─────────────┘
 *               ▼
 *            (server)
 * ```
 *
 * The refresh token cookie is **HttpOnly** (not accessible via JavaScript) and is automatically
 * included when `withCredentials` is enabled.
 */

/**
 * Options for creating an authenticated Apollo client.
 */
export interface CreateAuthApolloClientOptions {
    /** When `false`, does not apply {@link defaultOptions} (caller may pass custom `defaultOptions`). */   
    cache?: boolean
    /** Forward cookies on same-origin or cross-site requests. */
    withCredentials?: boolean
    /** Additional headers passed to the {@link https://www.apollographql.com/docs/react/api/link/apollo-link-http | HttpLink}. */
    headers?: GraphQLHeaders
    /** Optional {@link https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal | AbortSignal} for all operations on this client; merged into {@link https://www.apollographql.com/docs/react/api/link/apollo-link-http | HttpLink} `fetchOptions`. */
    signal?: AbortSignal
    /** When `true`, logs the flow through the link chain (DynamicAuthLink, AuthRefreshLink, ErrorLink, HttpLink). */
    debug?: boolean
    /** Minimum validity window (seconds) for proactive refresh and for {@link mutateRefreshToken} via the default refresh chain. */
    minValiditySeconds?: number
    /** The URI of the GraphQL endpoint. */
    uri?: string
    /** The function to set the access token. */
    setAccessToken?: (accessToken: string) => void
    /** The function to get the access token. */
    getAccessToken?: () => string
    /** Called when the client confirms the user is authenticated (e.g. after refresh sets a new access token). */
    resolveAuthenticated?: () => void
}

export const createAuthApolloClient = ({
    cache = true,
    withCredentials = true,
    headers = {},
    signal,
    debug = false,
    minValiditySeconds = 30,
    uri,
    getAccessToken,
    setAccessToken,
    resolveAuthenticated,
}: CreateAuthApolloClientOptions) => {
    const resolveAccessToken =
        getAccessToken
        ?? (() =>
            LocalStorage.getItemAsString(
                LocalStorageId.KeycloakAccessToken
            ))

    const persistAccessToken =
        (accessToken: string) => {
            if (setAccessToken) {
                setAccessToken(accessToken)
            } else {
                LocalStorage.setItem(
                    LocalStorageId.KeycloakAccessToken,
                    accessToken
                )
            }
            resolveAuthenticated?.()
        }

    return new ApolloClient({
        link: ApolloLink.from([
            createRetryLink(),
            createErrorLink(debug),
            createTimeoutLink(),
            createProactiveAccessTokenRefreshLink(
                minValiditySeconds,
                debug,
                resolveAccessToken,
                persistAccessToken,
            ),
            createAttachAccessTokenLink({
                debug,
                getAccessToken: resolveAccessToken,
            }),
            createAttachCsrfTokenLink(debug),
            createAttachDeviceFingerprintLink(debug),
            createHttpLink({
                uri,
                withCredentials,
                headers,
                signal,
            }),
        ]),
        cache: new InMemoryCache(),
        defaultOptions: cache ? defaultOptions : undefined,
    })
}