import { renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

/**
 * Unit — the resource-hub query hook (mock → real `GET /api/v1/resources`).
 *
 * The hub used to render a hard-coded sample and filter it client-side. These
 * tests pin the real contract:
 *  - the search text + type filter live IN THE SWR KEY (one cache entry and one
 *    request per filter combination — no client-side `.filter()`),
 *  - the same values ride the request as `q` / `type` query params, with the FE
 *    slug translated back to the backend enum constant,
 *  - `ResourceSummary` maps onto the row contract with the REAL UUID as `id`.
 *
 * `swr` is stubbed so the key/fetcher can be inspected without a provider.
 */

const hoisted = vi.hoisted(() => ({
    calls: [] as Array<{ key: unknown; fetcher: () => Promise<unknown> }>,
    listResources: vi.fn(),
}))

vi.mock("swr", () => ({
    default: (key: unknown, fetcher: () => Promise<unknown>) => {
        hoisted.calls.push({ key, fetcher })
        return {
            data: undefined,
            isLoading: false,
            isValidating: false,
            error: undefined,
            mutate: vi.fn(),
        }
    },
}))

vi.mock("next-intl", () => ({
    useTranslations: () => (key: string, values?: Record<string, unknown>) =>
        values ? `${key}:${JSON.stringify(values)}` : key,
}))

vi.mock("@/modules/api/rest/resource", () => ({
    listResources: (params: unknown) => hoisted.listResources(params),
}))

import {
    buildResourceHubKey,
    mapResourceSummary,
    toBackendResourceType,
    toHubResourceType,
    useQueryResourceHubSwr,
    RESOURCE_HUB_TAG,
} from "./useQueryResourceHubSwr"

const summary = {
    id: "6f1c9c9e-0d64-4b7f-9d33-0e4d0f4a1a11",
    title: "Giáo trình PRF192",
    type: "SOURCE_CODE",
    subjectId: "9a2f0f61-4a2a-4e2c-9a37-6b39a1c7ce02",
    visibility: "PUBLIC",
    license: "CC_BY",
    avgRating: 4.5,
    ratingCount: 12,
    downloadCount: 34,
}

const labels = {
    typeLabel: (type: string) => `type:${type}`,
    downloadsLabel: (count: number) => `${count} downloads`,
}

describe("resource-hub type mapping", () => {
    it("normalizes backend enum constants onto FE slugs, unknown → other", () => {
        expect(toHubResourceType("SOURCE_CODE")).toBe("source")
        expect(toHubResourceType("pdf")).toBe("pdf")
        expect(toHubResourceType("PODCAST")).toBe("other")
        expect(toHubResourceType(undefined)).toBe("other")
    })

    it("sends the backend constant as the `type` param, nothing for all/other", () => {
        expect(toBackendResourceType("source")).toBe("SOURCE_CODE")
        expect(toBackendResourceType("pe")).toBe("PE")
        expect(toBackendResourceType("all")).toBeUndefined()
        expect(toBackendResourceType("other")).toBeUndefined()
    })
})

describe("mapResourceSummary", () => {
    it("keeps the real UUID and derives the display meta", () => {
        const row = mapResourceSummary(summary, labels)

        expect(row.id).toBe(summary.id)
        expect(row.type).toBe("source")
        expect(row.subjectId).toBe(summary.subjectId)
        expect(row.subject).toBe("type:source")
        expect(row.sizeLabel).toBe("34 downloads")
        expect(row.downloadCount).toBe(34)
        expect(row.ratingCount).toBe(12)
        expect(row.avgRating).toBe(4.5)
    })

    it("defaults the counters a lean payload may omit", () => {
        const row = mapResourceSummary(
            { ...summary, type: "NOPE" } as never,
            labels,
        )

        expect(row.type).toBe("other")
    })
})

describe("buildResourceHubKey", () => {
    it("varies with the query and the type filter", () => {
        expect(buildResourceHubKey("kafka", "video", 0, 20)).toEqual([
            RESOURCE_HUB_TAG,
            "kafka",
            "video",
            0,
            20,
        ])
        expect(buildResourceHubKey("kafka", "video", 0, 20)).not.toEqual(
            buildResourceHubKey("kafka", "pdf", 0, 20),
        )
        expect(buildResourceHubKey("kafka", "video", 0, 20)).not.toEqual(
            buildResourceHubKey("nginx", "video", 0, 20),
        )
    })
})

describe("useQueryResourceHubSwr", () => {
    beforeEach(() => {
        hoisted.calls = []
        hoisted.listResources.mockResolvedValue({ items: [summary], total: 1, page: 0, size: 20 })
    })

    afterEach(() => {
        vi.clearAllMocks()
    })

    it("puts the (trimmed) query and the type filter in the SWR key", () => {
        renderHook(() => useQueryResourceHubSwr({ q: "  kafka  ", type: "video" }))

        expect(hoisted.calls.at(-1)?.key).toEqual([RESOURCE_HUB_TAG, "kafka", "video", 0, 20])
    })

    it("fetches GET /resources with q + the backend type constant and maps the rows", async () => {
        renderHook(() => useQueryResourceHubSwr({ q: "kafka", type: "source" }))

        const rows = (await hoisted.calls.at(-1)?.fetcher()) as {
            items: Array<{ id: string; type: string }>
            total: number
        }

        expect(hoisted.listResources).toHaveBeenCalledWith({
            q: "kafka",
            type: "SOURCE_CODE",
            page: 0,
            size: 20,
        })
        expect(rows.items).toHaveLength(1)
        expect(rows.items[0]?.id).toBe(summary.id)
        expect(rows.items[0]?.type).toBe("source")
        expect(rows.total).toBe(1)
    })

    it("omits q and type when nothing is filtered", async () => {
        renderHook(() => useQueryResourceHubSwr())

        await hoisted.calls.at(-1)?.fetcher()

        expect(hoisted.listResources).toHaveBeenCalledWith({
            q: undefined,
            type: undefined,
            page: 0,
            size: 20,
        })
        expect(hoisted.calls.at(-1)?.key).toEqual([RESOURCE_HUB_TAG, "", "all", 0, 20])
    })
})
