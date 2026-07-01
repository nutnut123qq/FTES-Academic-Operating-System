import { ApolloClient, ApolloLink, InMemoryCache } from "@apollo/client"
import { 
    createRetryLink, 
    defaultOptions,
    createErrorLink,
    createTimeoutLink,
    createHttpLink,
    createAttachDeviceFingerprintLink,
} from "../links"
import { type GraphQLHeaders } from "../../types"

/**
 * Anonymous (no-auth) Apollo client factory (GraphQL).
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
 *   │ 4. HttpLink             │  Executes GraphQL `POST` request.
 *   │                         │  `withCredentials: false` → cookies are not sent.
 *   └───────────┬─────────────┘
 *               ▼
 *            (server)
 * ```
 *
 * Options for creating a no-auth Apollo client.
 */
export interface CreateNoAuthApolloClientOptions {
    /** The URI of the GraphQL endpoint. */
    uri?: string
    /** When `false`, does not apply {@link defaultOptions} (caller may pass custom `defaultOptions`). */   
    cache?: boolean
    /** Additional headers passed to the {@link https://www.apollographql.com/docs/react/api/link/apollo-link-http | HttpLink}. */
    headers?: GraphQLHeaders
    /** When `true`, logs GraphQL / network / protocol errors. */
    debug?: boolean
    /** Optional {@link https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal | AbortSignal} for all operations on this client; merged into {@link https://www.apollographql.com/docs/react/api/link/apollo-link-http | HttpLink} `fetchOptions`. */
    signal?: AbortSignal
    /** When `true`, sends cookies on cross-site requests (`credentials: "include"`). */
    withCredentials?: boolean
}

export const createNoAuthApolloClient = ({
    uri,
    cache = true,
    headers = {},
    debug = false,
    signal,
    withCredentials = false,
}: CreateNoAuthApolloClientOptions) => {
    return new ApolloClient({
        link: ApolloLink.from([
            createRetryLink(),
            createErrorLink(debug),
            createTimeoutLink(),
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