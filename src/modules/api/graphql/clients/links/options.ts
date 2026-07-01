import { ApolloClient } from "@apollo/client"

/**
 * Default Apollo policies: avoid stale cache for queries unless a caller overrides `defaultOptions`.
 *
 * @see {@link https://www.apollographql.com/docs/react/api/core/ApolloClient#defaultoptions | ApolloClient defaultOptions}
 */
export const defaultOptions: ApolloClient.DefaultOptions = {
    watchQuery: {
        fetchPolicy: "no-cache",
        errorPolicy: "ignore",
    },
    query: {
        fetchPolicy: "no-cache",
        errorPolicy: "all",
    },
}
