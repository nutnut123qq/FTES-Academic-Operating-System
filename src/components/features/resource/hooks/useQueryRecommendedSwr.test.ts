import { renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

/**
 * Unit — resource recommendations (`GET /recommendations?type=RESOURCE`).
 *
 * Pins the two things a de-mocked reason line must never get wrong:
 *  - `Reason{code, params}` → i18n key mapping, INCLUDING the degrade paths
 *    (unknown code, malformed reason, known code with a missing/blank param),
 *  - the feed itself: auth-gated key, `type=RESOURCE`, snapshot title fallback and
 *    the `/resources/{itemId}` target id.
 */

type SwrCall = { key: unknown; fetcher: ((key: unknown) => unknown) | undefined }

const swrCalls: Array<SwrCall> = []

vi.mock("swr", () => ({
    default: (key: unknown, fetcher: ((key: unknown) => unknown) | undefined) => {
        swrCalls.push({ key, fetcher })
        return { data: undefined, error: undefined, isLoading: false, mutate: vi.fn() }
    },
}))

const getRecommendations = vi.fn()
vi.mock("@/modules/api/rest/recommendation", () => ({
    getRecommendations: (...args: Array<unknown>) => getRecommendations(...args),
}))

let authenticated = true
vi.mock("@/redux/hooks", () => ({
    useAppSelector: (selector: (state: unknown) => unknown) =>
        selector({ keycloak: { authenticated } }),
}))

// `t("recommended.reasons.X", values)` → the key + the ICU values, so the test can
// assert WHICH message would render without loading the message catalog.
vi.mock("next-intl", () => ({
    useTranslations: () => (key: string, values?: Record<string, unknown>) =>
        values ? `${key}::${JSON.stringify(values)}` : key,
}))

import {
    DEFAULT_REASON,
    pickReason,
    RECOMMENDATION_TYPE,
    RECOMMENDED_RESOURCES_SWR_KEY,
    resolveReason,
    toRecommendedResource,
    useQueryRecommendedSwr,
} from "./useQueryRecommendedSwr"
import type { RecommendationItem } from "@/modules/api/rest/recommendation"

/** Fake `t` scoped to `resourceHub`: echoes the key (+ ICU values) instead of a message. */
const translate = (key: string, values?: Record<string, string | number>) =>
    values ? `${key}::${JSON.stringify(values)}` : key

beforeEach(() => {
    swrCalls.length = 0
    getRecommendations.mockReset()
    authenticated = true
})

describe("resolveReason", () => {
    it("maps a known param-free code onto its own caption", () => {
        expect(resolveReason({ code: "TRENDING", params: {} })).toEqual({ key: "TRENDING" })
        expect(resolveReason({ code: "POPULAR" })).toEqual({ key: "POPULAR" })
    })

    it("maps a known code WITH a usable param onto the *_PARAM variant", () => {
        expect(resolveReason({ code: "SAME_SUBJECT", params: { subject: " PRO192 " } })).toEqual({
            key: "SAME_SUBJECT_PARAM",
            values: { subject: "PRO192" },
        })
        expect(resolveReason({ code: "SIMILAR_USERS", params: { count: 3 } })).toEqual({
            key: "SIMILAR_USERS_PARAM",
            values: { count: 3 },
        })
    })

    it("falls back to the plain caption when the param is missing, blank or unusable", () => {
        expect(resolveReason({ code: "SAME_SUBJECT" })).toEqual({ key: "SAME_SUBJECT" })
        expect(resolveReason({ code: "SAME_SUBJECT", params: { subject: "   " } })).toEqual({
            key: "SAME_SUBJECT",
        })
        expect(resolveReason({ code: "SIMILAR_USERS", params: { count: Number.NaN } })).toEqual({
            key: "SIMILAR_USERS",
        })
        expect(resolveReason({ code: "SAME_SUBJECT", params: "PRO192" })).toEqual({
            key: "SAME_SUBJECT",
        })
    })

    it("degrades an unknown / malformed reason to the generic caption", () => {
        expect(resolveReason({ code: "SOME_FUTURE_CODE", params: { x: 1 } })).toEqual(DEFAULT_REASON)
        expect(resolveReason({ code: 42 })).toEqual(DEFAULT_REASON)
        expect(resolveReason({})).toEqual(DEFAULT_REASON)
        expect(resolveReason(null)).toEqual(DEFAULT_REASON)
        expect(resolveReason("SAME_SUBJECT")).toEqual(DEFAULT_REASON)
    })

    it("does not treat inherited Object keys as reason codes", () => {
        expect(resolveReason({ code: "toString" })).toEqual(DEFAULT_REASON)
        expect(resolveReason({ code: "constructor" })).toEqual(DEFAULT_REASON)
    })
})

describe("pickReason", () => {
    it("takes the first reason it has a caption for", () => {
        expect(
            pickReason([
                { code: "SOME_FUTURE_CODE" },
                { code: "SAME_SUBJECT", params: { subject: "PRO192" } },
                { code: "TRENDING" },
            ]),
        ).toEqual({ key: "SAME_SUBJECT_PARAM", values: { subject: "PRO192" } })
    })

    it("degrades when the list is empty, absent or only carries unknown codes", () => {
        expect(pickReason([])).toEqual(DEFAULT_REASON)
        expect(pickReason(undefined)).toEqual(DEFAULT_REASON)
        expect(pickReason([{ code: "NOPE" }, {}])).toEqual(DEFAULT_REASON)
    })
})

describe("useQueryRecommendedSwr", () => {
    it("asks the engine for RESOURCE suggestions under a stable key", async () => {
        getRecommendations.mockResolvedValue([])
        renderHook(() => useQueryRecommendedSwr())
        const { key, fetcher } = swrCalls[swrCalls.length - 1]
        expect(key).toEqual([RECOMMENDED_RESOURCES_SWR_KEY])
        await fetcher?.(key)
        expect(getRecommendations).toHaveBeenCalledWith({ type: RECOMMENDATION_TYPE, limit: 20 })
        expect(RECOMMENDATION_TYPE).toBe("RESOURCE")
    })

    it("does not fetch for a guest (the endpoint is principal-scoped)", () => {
        authenticated = false
        const { result } = renderHook(() => useQueryRecommendedSwr())
        expect(swrCalls[swrCalls.length - 1].key).toBeNull()
        expect(result.current.authenticated).toBe(false)
        expect(result.current.isLoading).toBe(false)
    })

    it("maps snapshot title, the /resources link id and the localized reason", () => {
        const rows: Array<RecommendationItem> = [
            {
                id: "rec-1",
                recType: "RESOURCE",
                itemType: "RESOURCE",
                itemId: "res-1",
                score: 0.9,
                reasons: [{ code: "SAME_SUBJECT", params: { subject: "PRO192" } }],
                snapshot: { title: "  Slide CSD201  " },
            },
            // fallback row: POPULAR items are not persisted (no id) and may miss a snapshot
            {
                recType: "RESOURCE",
                itemType: "RESOURCE",
                itemId: "res-2",
                score: 0.4,
                reasons: [{ code: "WHO_KNOWS" }],
            },
        ]

        expect(rows.map((row) => toRecommendedResource(row, translate))).toEqual([
            {
                id: "rec-1",
                resourceId: "res-1",
                title: "Slide CSD201",
                reason: `recommended.reasons.SAME_SUBJECT_PARAM::${JSON.stringify({
                    subject: "PRO192",
                })}`,
            },
            {
                // no persisted id → the link/key falls back to the item id
                id: "res-2",
                resourceId: "res-2",
                title: "res-2",
                reason: "recommended.reasons.default",
            },
        ])
    })
})
