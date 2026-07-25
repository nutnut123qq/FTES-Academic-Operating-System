import React from "react"
import { renderHook, waitFor } from "@testing-library/react"
import { SWRConfig } from "swr"
import { beforeEach, describe, expect, it, vi } from "vitest"

const getCollectionDetail = vi.fn()
const updateCollectionItemNote = vi.fn()

vi.mock("@/modules/api/rest/resource", () => ({
    getCollectionDetail: (id: string) => getCollectionDetail(id),
    updateCollectionItemNote: (id: string, resourceId: string, request: unknown) =>
        updateCollectionItemNote(id, resourceId, request),
    // Imported by the hook; unused in these specs.
    removeCollectionItem: vi.fn(),
}))

vi.mock("@/redux/hooks", () => ({
    useAppSelector: (selector: (state: unknown) => unknown) =>
        selector({ keycloak: { authenticated: true } }),
}))

import { useQueryCollectionDetailSwr } from "./useQueryCollectionDetailSwr"
import type { CollectionDetailResponse } from "@/modules/api/rest/resource"

/**
 * Unit — editing a collection item's note IN PLACE.
 *
 * Fixing a note used to mean removing the resource and adding it back, which silently threw
 * the item to the end of the collection. The contract pinned here is that
 * `PATCH /collections/{id}/items/{resourceId}` keeps the item exactly where it was — before
 * the request, after the server echo, and after a rollback — and that a failed PATCH puts
 * the OLD note back instead of leaving text on screen the BE never stored.
 */

const COLLECTION = "col-1"

/** Three ordered items, as `GET /collections/{id}` returns them. */
const detail = (): CollectionDetailResponse => ({
    collection: {
        id: COLLECTION,
        kind: "RESOURCE_COLLECTION",
        title: "Ôn thi PE",
        ownerId: "viewer",
        visibility: "MEMBERS",
        itemCount: 3,
        status: "ACTIVE",
    },
    items: [
        { id: "i1", resourceId: "r1", title: "Đề cương", type: "PDF", sortOrder: 0, note: "đọc trước" },
        { id: "i2", resourceId: "r2", title: "Slide", type: "SLIDE", sortOrder: 1, note: "ghi chú cũ" },
        { id: "i3", resourceId: "r3", title: "Bài tập", type: "PDF", sortOrder: 2 },
    ],
})

/** Render the hook against an isolated SWR cache, waiting for the first fetch. */
const setup = async () => {
    const cache = new Map()
    const wrapper = ({ children }: { children: React.ReactNode }) => (
        <SWRConfig value={{ provider: () => cache, dedupingInterval: 0 }}>{children}</SWRConfig>
    )
    const { result } = renderHook(() => useQueryCollectionDetailSwr(COLLECTION), { wrapper })
    await waitFor(() => expect(result.current.items).toHaveLength(3))
    return { result }
}

const order = (items: Array<{ resourceId: string }>) => items.map((item) => item.resourceId)

beforeEach(() => {
    getCollectionDetail.mockReset()
    getCollectionDetail.mockResolvedValue(detail())
    updateCollectionItemNote.mockReset()
})

describe("useQueryCollectionDetailSwr — updateItemNote", () => {
    it("shows the new note in place, keeping the item's position", async () => {
        // Hold the PATCH open so the optimistic state is observable mid-flight.
        let resolvePatch: (value: unknown) => void = () => {}
        updateCollectionItemNote.mockImplementation(
            () =>
                new Promise((resolve) => {
                    resolvePatch = resolve
                }),
        )
        const { result } = await setup()

        const pending = result.current.updateItemNote("r2", "  ghi chú mới  ")

        await waitFor(() => expect(result.current.items[1].note).toBe("ghi chú mới"))
        expect(order(result.current.items)).toEqual(["r1", "r2", "r3"])

        resolvePatch({
            id: "i2",
            resourceId: "r2",
            title: "Slide",
            type: "SLIDE",
            sortOrder: 1,
            note: "ghi chú mới",
        })
        await pending

        // The blank-trimmed draft is what reaches the BE, and the row never moved.
        expect(updateCollectionItemNote).toHaveBeenCalledWith(COLLECTION, "r2", {
            note: "ghi chú mới",
        })
        expect(order(result.current.items)).toEqual(["r1", "r2", "r3"])
        expect(result.current.items[1].sortOrder).toBe(1)
        expect(result.current.items.map((item) => item.note)).toEqual([
            "đọc trước",
            "ghi chú mới",
            undefined,
        ])
    })

    it("clears the note with an undefined body when the draft is blank", async () => {
        updateCollectionItemNote.mockResolvedValue({
            id: "i2",
            resourceId: "r2",
            title: "Slide",
            type: "SLIDE",
            sortOrder: 1,
        })
        const { result } = await setup()

        await result.current.updateItemNote("r2", "   ")

        expect(updateCollectionItemNote).toHaveBeenCalledWith(COLLECTION, "r2", {
            note: undefined,
        })
        expect(result.current.items[1].note).toBeUndefined()
        expect(order(result.current.items)).toEqual(["r1", "r2", "r3"])
    })

    it("puts the previous note back — in place — when the PATCH fails", async () => {
        updateCollectionItemNote.mockRejectedValue(new Error("nope"))
        const { result } = await setup()

        await expect(result.current.updateItemNote("r2", "ghi chú mới")).rejects.toThrow()

        expect(result.current.items[1].note).toBe("ghi chú cũ")
        expect(order(result.current.items)).toEqual(["r1", "r2", "r3"])
    })
})
