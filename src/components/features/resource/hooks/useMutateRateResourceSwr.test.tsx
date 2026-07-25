import { renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { RestError } from "@/modules/api/rest/client"

const rateResource = vi.fn()

vi.mock("@/modules/api/rest/resource", () => ({
    rateResource: (resourceId: string, request: unknown) => rateResource(resourceId, request),
}))

import { classifyRateResourceError, useMutateRateResourceSwr } from "./useMutateRateResourceSwr"

/**
 * Unit — the resource rating write. The reviews page used to append to local state and
 * never talk to the BE, so any server refusal was invisible. The contract pinned here is
 * that a refusal is CLASSIFIED rather than thrown: a `409` ("you already rated this") must
 * come back as `conflict` so the page can say so and refetch the stored rating, not blow
 * up the composer or look like a network error.
 */

const RESOURCE = "resource-uuid"

beforeEach(() => {
    rateResource.mockReset()
})

describe("useMutateRateResourceSwr", () => {
    it("reports a 409 as a conflict instead of rejecting", async () => {
        rateResource.mockRejectedValue(
            new RestError("Đã đánh giá — RESOURCE_ALREADY_RATED", 409, "RESOURCE_ALREADY_RATED"),
        )
        const { result } = renderHook(() => useMutateRateResourceSwr())

        const outcome = await result.current.submit(RESOURCE, { stars: 5, review: "hay" })

        expect(outcome.status).toBe("conflict")
        expect(rateResource).toHaveBeenCalledWith(RESOURCE, { stars: 5, review: "hay" })
    })

    it("returns the saved rating on success", async () => {
        rateResource.mockResolvedValue({
            id: "rating-1",
            userId: "viewer",
            stars: 4,
            review: "ổn",
            createdAt: "2026-07-25T00:00:00Z",
        })
        const { result } = renderHook(() => useMutateRateResourceSwr())

        const outcome = await result.current.submit(RESOURCE, { stars: 4, review: "ổn" })

        expect(outcome.status).toBe("rated")
        expect(outcome.status === "rated" ? outcome.rating.id : null).toBe("rating-1")
    })

    it("separates the other refusals so each gets its own message", () => {
        expect(classifyRateResourceError(new RestError("", 401)).status).toBe("unauthorized")
        expect(classifyRateResourceError(new RestError("", 403)).status).toBe("forbidden")
        expect(classifyRateResourceError(new RestError("", 404)).status).toBe("notFound")
        expect(classifyRateResourceError(new RestError("", 429)).status).toBe("rateLimited")
        expect(classifyRateResourceError(new RestError("", 500)).status).toBe("error")
        expect(classifyRateResourceError(new Error("network down")).status).toBe("error")
    })
})
