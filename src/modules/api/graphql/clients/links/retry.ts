import { RetryLink } from "@apollo/client/link/retry"
import { publicEnv } from "@/resources/env/public"

/**
 * Retries failed operations with jittered exponential backoff.
 *
 * Delay and max-attempt values are read from `publicEnv().graphql`
 * (`initialRetryDelay`, `maxRetryDelay`, `maxRetry`).
 *
 * Placed **first** in the link chain so transient network errors are retried
 * before any other link sees the failure.
 *
 * @see {@link https://www.apollographql.com/docs/react/api/link/apollo-link-retry | RetryLink API}
 */
export const createRetryLink = () => {
    return new RetryLink({
        delay: {
            initial: publicEnv().graphql.initialRetryDelay,
            max: publicEnv().graphql.maxRetryDelay,
            jitter: true,
        },
        attempts: {
            max: publicEnv().graphql.maxRetry,
            retryIf: (error) => {
                return !!error
            },
        },
    })
}
