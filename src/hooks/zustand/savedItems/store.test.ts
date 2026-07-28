import { beforeEach, describe, expect, it } from "vitest"
import { useSavedItemsStore } from "./store"

/**
 * Unit — {@link useSavedItemsStore.mergeSavedPosts} (saved-posts-not-showing fix).
 *
 * The `/saved` library used to decide which POSTS are saved from this store alone
 * (client-only localStorage), then look up display data from the real BE bookmark
 * list — so a post bookmarked on the SERVER but missing from local storage (another
 * device / cleared storage) was silently dropped. `mergeSavedPosts` reconciles the
 * server list into the store so those posts render; these tests pin that contract:
 *  - server posts absent locally are ADDED (the bug fix),
 *  - existing entries are never overwritten or duplicated,
 *  - it is idempotent / a no-op once every id is present (the render-effect that
 *    calls it every render must not loop),
 *  - merged rows keep the server's newest-saved-first order.
 */
describe("useSavedItemsStore.mergeSavedPosts", () => {
    beforeEach(() => {
        window.localStorage.clear()
        useSavedItemsStore.setState({ items: [], isHydrated: true })
    })

    it("adds server-bookmarked posts that are absent from the local store", () => {
        useSavedItemsStore.getState().mergeSavedPosts([{ entityId: "p1" }, { entityId: "p2" }])

        const { items } = useSavedItemsStore.getState()
        expect(items.map((item) => item.entityId).sort()).toEqual(["p1", "p2"])
        expect(items.every((item) => item.entityType === "post")).toBe(true)
    })

    it("does not duplicate or overwrite a post already in the store", () => {
        useSavedItemsStore.setState({
            items: [
                {
                    entityType: "post",
                    entityId: "p1",
                    savedAt: 123,
                    source: { kind: "group", id: "g9", label: "Nhóm React" },
                },
            ],
            isHydrated: true,
        })

        useSavedItemsStore.getState().mergeSavedPosts([{ entityId: "p1" }, { entityId: "p2" }])

        const { items } = useSavedItemsStore.getState()
        expect(items.filter((item) => item.entityId === "p1")).toHaveLength(1)
        // the captured savedAt + source of the existing entry are preserved
        const existing = items.find((item) => item.entityId === "p1")
        expect(existing?.savedAt).toBe(123)
        expect(existing?.source).toEqual({ kind: "group", id: "g9", label: "Nhóm React" })
        // and the missing one was added
        expect(items.some((item) => item.entityId === "p2")).toBe(true)
    })

    it("is a no-op (same reference, no re-render) when every id is already present", () => {
        useSavedItemsStore.getState().mergeSavedPosts([{ entityId: "p1" }, { entityId: "p2" }])
        const before = useSavedItemsStore.getState().items

        useSavedItemsStore.getState().mergeSavedPosts([{ entityId: "p1" }, { entityId: "p2" }])
        const after = useSavedItemsStore.getState().items

        // no additions → the items array identity is untouched (loop-safe)
        expect(after).toBe(before)
    })

    it("keeps the server newest-saved-first order among merged rows", () => {
        // server returns p1 (newest) then p2 then p3
        useSavedItemsStore.getState().mergeSavedPosts([
            { entityId: "p1" },
            { entityId: "p2" },
            { entityId: "p3" },
        ])

        const byId = new Map(
            useSavedItemsStore.getState().items.map((item) => [item.entityId, item.savedAt]),
        )
        // newest-first ⇒ strictly decreasing savedAt in server order
        expect(byId.get("p1")!).toBeGreaterThan(byId.get("p2")!)
        expect(byId.get("p2")!).toBeGreaterThan(byId.get("p3")!)
    })

    it("persists merged posts so a later store read still lists them", () => {
        useSavedItemsStore.getState().mergeSavedPosts([{ entityId: "p1" }])

        const raw = window.localStorage.getItem("ftes.savedItems.v1")
        expect(raw).toBeTruthy()
        const parsed = JSON.parse(raw as string) as Array<{ entityId: string }>
        expect(parsed.some((item) => item.entityId === "p1")).toBe(true)
    })
})
