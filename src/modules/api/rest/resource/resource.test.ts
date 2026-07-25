import { beforeEach, describe, expect, it, vi } from "vitest"

/**
 * Unit — pins the HTTP contract of the resource comment client fns against the
 * REAL BE (`ResourceCommentController`): the list endpoint answers with the
 * enveloped `CommentPage {items, page, size, total}` and takes a **1-based**
 * `page` (the service shifts it to a 0-based `PageRequest` itself). A wrapper
 * that re-shifts the page or re-shapes a bare array would hand the comment tree
 * a non-array `items` — hence these assertions.
 */

const restRequest = vi.fn()

vi.mock("@/modules/api/rest/client", () => ({
    restRequest: (...args: Array<unknown>) => restRequest(...args),
}))

import { getResourceComments } from "./resource"
import type { ResourceCommentsPage } from "./types"

const PAGE: ResourceCommentsPage = {
    items: [
        {
            id: "c-1",
            userId: "u-1",
            parentId: null,
            content: "Bài này hay",
            status: "VISIBLE",
            createdAt: "2026-07-25T00:00:00Z",
            replies: [],
        },
    ],
    page: 2,
    size: 20,
    total: 21,
}

beforeEach(() => {
    restRequest.mockReset()
})

describe("getResourceComments", () => {
    it("sends the page 1-based (no client-side shift) and returns the BE page verbatim", async () => {
        restRequest.mockResolvedValue(PAGE)

        const result = await getResourceComments("res-1", { page: 2, size: 20 })

        expect(restRequest).toHaveBeenCalledWith({
            method: "GET",
            url: "/resources/res-1/comments",
            params: { page: 2, size: 20 },
            authenticated: true,
        })
        // enveloped CommentPage passed through — `items` stays an array and
        // `total` is the BE count, never a client-side guess
        expect(result).toBe(PAGE)
        expect(Array.isArray(result.items)).toBe(true)
        expect(result.total).toBe(21)
    })

    it("defaults to page 1 / size 20 — page 1 must NOT become 0", async () => {
        restRequest.mockResolvedValue({ ...PAGE, page: 1 })

        await getResourceComments("res-1")

        expect(restRequest).toHaveBeenCalledWith({
            method: "GET",
            url: "/resources/res-1/comments",
            params: { page: 1, size: 20 },
            authenticated: true,
        })
    })
})
