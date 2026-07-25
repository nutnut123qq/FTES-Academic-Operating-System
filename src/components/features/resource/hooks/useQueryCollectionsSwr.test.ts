import { renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

/**
 * Unit — the viewer's resource collections (`GET /resources/collections/me`).
 *
 * Pins the de-mocked contract:
 *  - auth gate: a guest never fires the principal-scoped endpoint (key `null`),
 *  - the fetcher hits `getMyCollections` and maps `itemCount`/absent description,
 *  - `create` posts a `RESOURCE_COLLECTION` (never `LEARNING_PACK`, which the BE
 *    rejects without a subject) and rolls the optimistic row back on failure,
 *  - API failures bucket into the `resourceHub.apiErrors.*` keys.
 */

type SwrCall = { key: unknown; fetcher: ((key: unknown) => unknown) | undefined }

const swrCalls: Array<SwrCall> = []
const mutate = vi.fn(async (updater?: unknown, _options?: unknown) => {
    if (typeof updater === "function") {
        cache = (updater as (current: unknown) => unknown)(cache)
    }
    return cache
})
let cache: unknown

vi.mock("swr", () => ({
    default: (key: unknown, fetcher: ((key: unknown) => unknown) | undefined) => {
        swrCalls.push({ key, fetcher })
        return { data: cache, error: undefined, isLoading: false, mutate }
    },
}))

const getMyCollections = vi.fn()
const createCollection = vi.fn()
vi.mock("@/modules/api/rest/resource", () => ({
    getMyCollections: (...args: Array<unknown>) => getMyCollections(...args),
    createCollection: (...args: Array<unknown>) => createCollection(...args),
}))

let authenticated = true
vi.mock("@/redux/hooks", () => ({
    useAppSelector: (selector: (state: unknown) => unknown) =>
        selector({ keycloak: { authenticated } }),
}))

import { RestError } from "@/modules/api/rest/client"
import {
    COLLECTIONS_SWR_KEY,
    DEFAULT_COLLECTION_KIND,
    resolveResourceErrorKey,
    toResourceCollection,
    useQueryCollectionsSwr,
} from "./useQueryCollectionsSwr"

const BE_ROW = {
    id: "col-1",
    kind: "RESOURCE_COLLECTION",
    title: "  Ôn thi PE  ",
    ownerId: "user-1",
    visibility: "MEMBERS",
    itemCount: 8,
    status: "ACTIVE",
}

beforeEach(() => {
    swrCalls.length = 0
    cache = undefined
    mutate.mockClear()
    getMyCollections.mockReset()
    createCollection.mockReset()
    authenticated = true
})

describe("toResourceCollection", () => {
    it("maps itemCount → count and never leaves description undefined", () => {
        expect(toResourceCollection(BE_ROW)).toEqual({
            id: "col-1",
            title: "Ôn thi PE",
            description: "",
            count: 8,
            kind: "RESOURCE_COLLECTION",
            visibility: "MEMBERS",
        })
    })
})

describe("useQueryCollectionsSwr", () => {
    it("fetches the caller's collections under a stable key", async () => {
        getMyCollections.mockResolvedValue([BE_ROW])
        renderHook(() => useQueryCollectionsSwr())
        const { key, fetcher } = swrCalls[swrCalls.length - 1]
        expect(key).toEqual([COLLECTIONS_SWR_KEY])
        await expect(fetcher?.(key)).resolves.toEqual([BE_ROW])
        expect(getMyCollections).toHaveBeenCalledWith({ page: 0, size: 50 })
    })

    it("tolerates a null payload from the envelope", async () => {
        getMyCollections.mockResolvedValue(null)
        renderHook(() => useQueryCollectionsSwr())
        const { key, fetcher } = swrCalls[swrCalls.length - 1]
        await expect(fetcher?.(key)).resolves.toEqual([])
    })

    it("exposes the mapped rows once the cache is warm", () => {
        cache = [BE_ROW]
        const { result } = renderHook(() => useQueryCollectionsSwr())
        expect(result.current.collections).toHaveLength(1)
        expect(result.current.collections[0]).toMatchObject({ title: "Ôn thi PE", count: 8 })
    })

    it("does not fetch for a guest (the endpoint lists the CALLER's collections)", () => {
        authenticated = false
        const { result } = renderHook(() => useQueryCollectionsSwr())
        expect(swrCalls[swrCalls.length - 1].key).toBeNull()
        expect(result.current.authenticated).toBe(false)
        expect(result.current.isLoading).toBe(false)
        expect(getMyCollections).not.toHaveBeenCalled()
    })

    it("creates a RESOURCE_COLLECTION and keeps the created row in the list", async () => {
        cache = []
        const created = { ...BE_ROW, id: "col-new", title: "Bộ mới", itemCount: 0 }
        createCollection.mockResolvedValue(created)
        const { result } = renderHook(() => useQueryCollectionsSwr())

        await result.current.create({ title: "  Bộ mới  ", description: "  " })

        expect(createCollection).toHaveBeenCalledWith({
            kind: DEFAULT_COLLECTION_KIND,
            title: "Bộ mới",
            description: undefined,
        })
        expect(DEFAULT_COLLECTION_KIND).toBe("RESOURCE_COLLECTION")
        expect(cache).toEqual([created])
    })

    it("rolls the optimistic row back when the POST fails", async () => {
        cache = [BE_ROW]
        createCollection.mockRejectedValue(new RestError("nope", 403, "RESOURCE_ACCESS_DENIED"))
        const { result } = renderHook(() => useQueryCollectionsSwr())

        await expect(result.current.create({ title: "Bộ hỏng" })).rejects.toBeInstanceOf(RestError)
        expect(cache).toEqual([BE_ROW])
    })
})

describe("resolveResourceErrorKey", () => {
    it("buckets the API statuses the UI has copy for", () => {
        expect(resolveResourceErrorKey(new RestError("x", 401))).toBe("unauthorized")
        expect(resolveResourceErrorKey(new RestError("x", 403))).toBe("forbidden")
        expect(resolveResourceErrorKey(new RestError("x", 404))).toBe("notFound")
        expect(resolveResourceErrorKey(new RestError("x", 429))).toBe("rateLimited")
        expect(resolveResourceErrorKey(new RestError("x", 500))).toBe("generic")
    })

    it("treats a non-REST failure (network/parse) as generic", () => {
        expect(resolveResourceErrorKey(new Error("Network Error"))).toBe("generic")
        expect(resolveResourceErrorKey(undefined)).toBe("generic")
    })
})
