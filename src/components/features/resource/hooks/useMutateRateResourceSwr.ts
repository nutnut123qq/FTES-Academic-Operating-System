"use client"

import { useCallback, useState } from "react"

import { RestError } from "@/modules/api/rest/client"
import { rateResource, type RateRequest, type RatingResponse } from "@/modules/api/rest/resource"

/**
 * What came back from a rating write, already classified so the caller only picks copy.
 *
 * `conflict` covers a BE that answers `409` for "this viewer already rated" — today the
 * service upserts instead, but the FE must not blow up if that policy tightens, and the
 * right reaction (refetch, then say "your rating was updated") is the same either way.
 */
export type RateResourceOutcome =
    | { status: "rated"; rating: RatingResponse }
    | { status: "conflict" }
    | { status: "unauthorized" }
    | { status: "forbidden" }
    | { status: "notFound" }
    | { status: "rateLimited" }
    | { status: "error"; error: Error }

/**
 * Maps a failed rating write onto a {@link RateResourceOutcome}.
 *
 * @param error - Whatever the REST call rejected with.
 */
export const classifyRateResourceError = (error: unknown): RateResourceOutcome => {
    if (error instanceof RestError) {
        switch (error.status) {
            case 401:
                return { status: "unauthorized" }
            case 403:
                return { status: "forbidden" }
            case 404:
                return { status: "notFound" }
            case 409:
                return { status: "conflict" }
            case 429:
                return { status: "rateLimited" }
            default:
                return { status: "error", error }
        }
    }
    return { status: "error", error: error instanceof Error ? error : new Error(String(error)) }
}

/**
 * Submits the viewer's star rating + review for a resource
 * (`POST /api/v1/resources/{id}/ratings`).
 *
 * Never rejects: every failure is classified ({@link classifyRateResourceError}) so the
 * component maps the outcome to a message instead of catching. The caller revalidates the
 * ratings list afterwards — including on `conflict`, where the server state is the truth
 * and a refetch is exactly what shows it.
 *
 * @returns `submit(resourceId, request)` plus `isMutating`.
 */
export const useMutateRateResourceSwr = () => {
    const [isMutating, setIsMutating] = useState(false)

    const submit = useCallback(
        async (resourceId: string, request: RateRequest): Promise<RateResourceOutcome> => {
            setIsMutating(true)
            try {
                const rating = await rateResource(resourceId, request)
                return { status: "rated", rating }
            } catch (error) {
                return classifyRateResourceError(error)
            } finally {
                setIsMutating(false)
            }
        },
        [],
    )

    return { submit, isMutating }
}
