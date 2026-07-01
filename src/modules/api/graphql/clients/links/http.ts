import { HttpLink } from "@apollo/client"
import { type GraphQLHeaders } from "../../types"
import { publicEnv } from "@/resources/env/public"

/**
 * Parameters for creating an HTTP link.
 * @param withCredentials - When `true`, sends cookies on cross-site requests (`credentials: "include"`).
 * @param headers - Extra static headers merged into each request.
 */
export interface CreateHttpLinkParams {
    /** When `true`, sends cookies on cross-site requests (`credentials: "include"`). */
    withCredentials?: boolean
    /** Extra static headers merged into each request. */
    headers?: GraphQLHeaders
    /** The URI of the GraphQL endpoint. */
    uri?: string
    /** Optional {@link AbortSignal} for all operations on this client; merged into `fetchOptions`. */
    signal?: AbortSignal
}
/**
 * Terminal link: HTTP transport to the configured GraphQL endpoint (`publicEnv().api.graphql`).
 *
 * @param withCredentials - When `true`, sends cookies on cross-site requests (`credentials: "include"`).
 * @param headers - Extra static headers merged into each request.
 * @param signal - Optional {@link AbortSignal} for all operations on this client; merged into `fetchOptions`.
 *
 * @see {@link https://www.apollographql.com/docs/react/api/link/apollo-link-http | HttpLink API}
 * @see {@link https://www.apollographql.com/docs/react/networking/advanced-http-networking#including-credentials-in-requests | Including credentials}
 */
export const createHttpLink = (
    { 
        withCredentials = true, 
        headers = {}, 
        uri,
        signal
    }: CreateHttpLinkParams,
) => {
    return new HttpLink({
        uri: uri ?? `${publicEnv().api.graphql}`,
        credentials: withCredentials ? "include" : "same-origin",
        headers: Object.fromEntries(
            Object.entries(headers).filter(([, v]) => v !== undefined)
        ) as Record<string, string>,
        fetchOptions: {
            signal,
        },
    })
}
