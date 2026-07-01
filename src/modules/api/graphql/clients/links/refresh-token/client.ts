import { 
    ApolloClient, 
    ApolloLink, 
    InMemoryCache 
} from "@apollo/client"
import {
    createErrorLink,
    createTimeoutLink,
    createRetryLink,
    createAttachAccessTokenLink,
    createAttachCsrfTokenLink,
    createAttachDeviceFingerprintLink,
    defaultOptions,
    createHttpLink
} from "../../links"
import { publicEnv } from "@/resources/env/public"

/**
 * Parameters for creating a refresh token Apollo client.
 */
export interface CreateRefreshTokenApolloClientParams {
    /** When `true`, logs attach-token and auth-related errors (not all network errors). */
    debug?: boolean;

    /** Optional AbortSignal forwarded to `HttpLink` for request cancellation (e.g. SWR abort). */
    signal?: AbortSignal;
}

/**
 * Creates a minimal Apollo Client instance dedicated to the `refreshToken` mutation.
 */
export const createRefreshTokenApolloClient = ({
    signal,
    debug = false,
}: CreateRefreshTokenApolloClientParams) => {
    return new ApolloClient({
        link: ApolloLink.from([
            createRetryLink(),
            createErrorLink(debug),
            createTimeoutLink(),
            createAttachAccessTokenLink(debug),
            createAttachCsrfTokenLink(debug),
            createAttachDeviceFingerprintLink(debug),
            createHttpLink({
                withCredentials: true,
                headers: {},
                uri: `${publicEnv().api.graphql}`,
                signal,
            }),
        ]),
        cache: new InMemoryCache(),
        defaultOptions,
    })
}