import { beforeEach, describe, expect, it, vi } from "vitest"

/**
 * Unit — the REST envelope unwrap in {@link restRequest} (`client.ts`). The
 * per-fn client tests (e.g. `gamification.test.ts`) mock `restRequest` itself, so
 * this is the ONE place the real `{code,message,data}` handling is exercised:
 *  - a `code:200` success returns `data` verbatim (unwrapped),
 *  - a valid `code:200` with `data:null` (void endpoints) returns `null`,
 *  - a non-200 envelope on a 2xx HTTP response throws a {@link RestError} with the
 *    envelope `code` + nested `errorCode`,
 *  - an axios error (non-2xx HTTP) is normalised to a {@link RestError} carrying the
 *    HTTP status + `errorCode`.
 *
 * `axios` is mocked so no network/instance is touched: `axios.create` returns a
 * stub whose `.request` resolves/rejects a canned envelope, and `axios.isAxiosError`
 * is preserved for the error branch.
 */

const { request } = vi.hoisted(() => ({ request: vi.fn() }))

vi.mock("axios", () => {
    const isAxiosError = (error: unknown): boolean =>
        Boolean((error as { isAxiosError?: boolean } | null)?.isAxiosError)
    const axiosInstance = {
        defaults: { headers: { common: {} as Record<string, unknown> } },
        request,
    }
    return {
        default: { create: () => axiosInstance, isAxiosError },
        isAxiosError,
    }
})

import { restRequest, RestError } from "./client"

beforeEach(() => {
    request.mockReset()
})

describe("restRequest envelope unwrap", () => {
    it("returns the unwrapped data of a code:200 envelope", async () => {
        const payload = { totalXp: 1200, level: 5 }
        request.mockResolvedValue({
            data: { code: 200, message: "OK", data: payload },
        })

        const result = await restRequest<typeof payload>({
            method: "GET",
            url: "/gamification/me/progression",
        })

        expect(result).toEqual(payload)
    })

    it("returns null for a valid code:200 void envelope", async () => {
        request.mockResolvedValue({
            data: { code: 200, message: "OK", data: null },
        })

        const result = await restRequest<null>({ method: "POST", url: "/x" })

        expect(result).toBeNull()
    })

    it("throws a RestError when the envelope code is not 200", async () => {
        request.mockResolvedValue({
            data: {
                code: 403,
                message: "Forbidden",
                data: { errorCode: "COURSE_FORBIDDEN", traceId: "t-1", details: [] },
            },
        })

        const error = await restRequest({ method: "GET", url: "/x" }).catch(
            (e: unknown) => e,
        )

        expect(error).toBeInstanceOf(RestError)
        expect((error as RestError).status).toBe(403)
        expect((error as RestError).errorCode).toBe("COURSE_FORBIDDEN")
        expect((error as RestError).message).toContain("COURSE_FORBIDDEN")
    })

    it("normalises an axios error (non-2xx HTTP) to a RestError with status", async () => {
        request.mockRejectedValue({
            isAxiosError: true,
            message: "Request failed with status code 401",
            response: {
                status: 401,
                data: {
                    code: 401,
                    message: "Unauthenticated",
                    data: { errorCode: "UNAUTHENTICATED", traceId: "t-2", details: [] },
                },
            },
        })

        const error = await restRequest({ method: "GET", url: "/me/streak" }).catch(
            (e: unknown) => e,
        )

        expect(error).toBeInstanceOf(RestError)
        expect((error as RestError).status).toBe(401)
        expect((error as RestError).errorCode).toBe("UNAUTHENTICATED")
    })
})
