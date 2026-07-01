import { publicEnv } from "@/resources/env/public"
import { ApolloLink, Observable } from "@apollo/client"

/**
 * Aborts the downstream {@link https://www.apollographql.com/docs/react/api/link/introduction | Apollo Link}
 * observable if the operation does not finish within the configured timeout window
 * (`publicEnv().graphql.timeout`).
 *
 * Placed **after** the error link and **before** the HTTP link in the chain so
 * that upstream links still receive the timeout error.
 *
 * @see {@link https://www.apollographql.com/docs/react/api/link/introduction | Apollo Link overview}
 * @see {@link https://www.apollographql.com/docs/react/networking/advanced-http-networking | Advanced HTTP networking}
 */
export const createTimeoutLink = () => {
    const timeoutMs = publicEnv().graphql.timeout
    return new ApolloLink((operation, forward) => {
        return new Observable((observer) => {
            // Fail fast when the server or network stalls.
            const timer = setTimeout(() => {
                observer.error(
                    new Error(`GraphQL request timed out after ${timeoutMs}ms`)
                )
            }, timeoutMs)
            const sub = forward(operation).subscribe({
                next: (value) => observer.next(value),
                error: (err) => {
                    clearTimeout(timer)
                    observer.error(err)
                },
                complete: () => {
                    clearTimeout(timer)
                    observer.complete()
                },
            })

            return () => {
                clearTimeout(timer)
                sub.unsubscribe()
            }
        })
    })
}
