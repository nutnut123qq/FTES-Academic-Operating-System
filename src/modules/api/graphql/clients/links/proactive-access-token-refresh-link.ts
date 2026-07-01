import { ApolloLink } from "@apollo/client"
import { Observable } from "@apollo/client/utilities"
import { Subscription } from "rxjs"
import jwt from "jsonwebtoken"
import { dayjs } from "@/modules/dayjs"
import { mutateRefreshToken } from "./refresh-token"
import { LocalStorage } from "@/modules/storage/local/storage"
import { LocalStorageId } from "@/modules/storage/local/enums/id"

/**
 * Returns `true` when the access token is within `minValiditySeconds` of expiring.
 * @param token - The access token to check.
 * @param minValiditySeconds - The minimum validity seconds.
 * @returns `true` when the access token is within `minValiditySeconds` of expiring, `false` otherwise.
 */
const shouldRefreshAccessTokenBeforeRequest = (
    token: string | undefined,
    minValiditySeconds: number
): boolean => {
    // if no token → refresh
    if (!token) return true
    // if token is expired → refresh
    const decoded = jwt.decode(token)
    if (!decoded || typeof decoded === "string") return true
    // if token is not expired → check if it is within `minValiditySeconds` of expiring
    if (typeof decoded.exp !== "number") return true
    // if token is not expired → check if it is within `minValiditySeconds` of expiring
    const now = dayjs()
    const expiry = dayjs.unix(decoded.exp)
    // if token is expired → refresh
    if (expiry.isBefore(now)) return true
    // if token is not expired → check if it is within `minValiditySeconds` of expiring
    const threshold = now.add(minValiditySeconds, "second")
    // if token is not expired → check if it is within `minValiditySeconds` of expiring
    return threshold.isAfter(expiry)
}

/**
 * Before the operation runs, if the current JWT is within `minValiditySeconds` of expiring, awaits
 * {@link runRefresh} so the next link sees a fresh token (avoids waiting for `UNAUTHENTICATED`).
 */
export const createProactiveAccessTokenRefreshLink = (
    minValiditySeconds: number,
    debug: boolean,
    getAccessToken?: () => string | undefined,
    setAccessToken?: (accessToken: string) => void
) =>
    new ApolloLink((operation, forward) => {
        return new Observable((observer) => {
            let sub: Subscription | null = null
            void (async () => {
                try {
                    const resolveAccessToken =
                        getAccessToken
                        ?? (() =>
                            LocalStorage.getItemAsString(
                                LocalStorageId.KeycloakAccessToken
                            ))

                    const persistAccessToken =
                        setAccessToken
                        ?? ((accessToken: string) =>
                            LocalStorage.setItem(
                                LocalStorageId.KeycloakAccessToken,
                                accessToken
                            ))

                    const token = resolveAccessToken()
                    // Only proactively refresh when we ACTUALLY have a token that is
                    // near/after expiry. Anonymous requests (no token) must proceed
                    // unauthenticated — public queries (e.g. a logged-out recruiter
                    // viewing a public profile) are valid, and attempting a refresh
                    // with no refresh session would otherwise throw and fail the whole
                    // query. A refresh failure is non-fatal: forward the request anyway
                    // and let the server enforce auth where it matters.
                    if (token && shouldRefreshAccessTokenBeforeRequest(token, minValiditySeconds)) {
                        if (debug) {
                            console.log(
                                `[ProactiveTokenRefreshLink] op=${operation.operationName} → token within ${minValiditySeconds}s of expiry, refresh before request`
                            )
                        }
                        try {
                            const result = await mutateRefreshToken(
                                {
                                    request: {
                                        minValiditySeconds,
                                    },
                                }
                            )
                            if (result.data?.refreshToken?.data?.accessToken) {
                                persistAccessToken(result.data.refreshToken.data.accessToken)
                            }
                        } catch (refreshError) {
                            if (debug) {
                                console.log(
                                    `[ProactiveTokenRefreshLink] op=${operation.operationName} → proactive refresh failed, forwarding anyway`,
                                    refreshError
                                )
                            }
                        }
                    }
                    sub = forward(operation).subscribe({
                        next: (result) => {
                            observer.next(result)
                        },
                        error: (error) => {
                            observer.error(error)
                        },
                        complete: () => {
                            observer.complete()
                        },
                    })
                } catch (error) {
                    observer.error(error)
                }
            })()
            return () => {
                sub?.unsubscribe()
            }
        })
    }
    )
