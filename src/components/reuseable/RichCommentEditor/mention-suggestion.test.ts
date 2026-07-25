import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

/**
 * Unit — the `@` mention typeahead (de-mock: static list → real user search index).
 *
 * `GET /api/v1/search` is mocked so these pin the contract Tiptap depends on:
 *  - keystrokes are COALESCED into one request per 250ms quiet period, and every
 *    superseded caller still settles (Tiptap awaits one promise per keystroke —
 *    a dropped promise would freeze the popup, a late stale one would flicker it),
 *  - a `USER` hit maps to the `MentionUser` shape (`slug` → username,
 *    `title` → displayName), hits of other types and slug-less hits are dropped,
 *  - a failed/forbidden lookup degrades to an empty list, never a rejection.
 */

const search = vi.fn()

vi.mock("@/modules/api/rest/search", () => ({
    search: (request: unknown) => search(request),
}))

import {
    MENTION_DEBOUNCE_MS,
    createDebouncedMentionSearch,
    searchMentionUsers,
    type MentionUser,
} from "./mention-suggestion"

/** One `USER` group as the BE serializes it (`DocType.name()` → upper-case). */
const userGroup = (hits: Array<Record<string, unknown>>) => ({
    mode: "keyword",
    groups: [{ type: "USER", total: hits.length, hits }],
})

beforeEach(() => {
    search.mockReset()
})

afterEach(() => {
    vi.useRealTimers()
})

describe("searchMentionUsers", () => {
    it("maps USER hits to the MentionUser shape", async () => {
        search.mockResolvedValue(
            userGroup([
                { docId: "u1", type: "USER", title: "Minh Trần", slug: "minh-tran", score: 1 },
                { docId: "u2", type: "USER", title: null, slug: "an-nguyen", score: 0.5 },
            ]),
        )

        await expect(searchMentionUsers("minh")).resolves.toEqual([
            { username: "minh-tran", displayName: "Minh Trần" },
            // title absent → the handle is the label (never an empty row)
            { username: "an-nguyen", displayName: "an-nguyen" },
        ] satisfies Array<MentionUser>)
        expect(search).toHaveBeenCalledWith({ q: "minh", types: ["user"], page: 0, size: 5 })
    })

    it("drops slug-less hits and ignores non-USER groups", async () => {
        search.mockResolvedValue({
            mode: "keyword",
            groups: [
                { type: "COURSE", total: 1, hits: [{ docId: "c1", type: "COURSE", title: "Java", slug: "java", score: 1 }] },
                { type: "USER", total: 2, hits: [
                    { docId: "u1", type: "USER", title: "No Slug", score: 1 },
                    { docId: "u2", type: "USER", title: "Hoa Lê", slug: "hoa-le", score: 1 },
                ] },
            ],
        })

        await expect(searchMentionUsers("h")).resolves.toEqual([
            { username: "hoa-le", displayName: "Hoa Lê" },
        ])
    })

    it("returns an empty list for a blank query and for a failed lookup", async () => {
        await expect(searchMentionUsers("   ")).resolves.toEqual([])
        expect(search).not.toHaveBeenCalled()

        search.mockRejectedValue(new Error("403"))
        await expect(searchMentionUsers("minh")).resolves.toEqual([])
    })
})

describe("createDebouncedMentionSearch", () => {
    it("fires one lookup per quiet period, with the LAST query", async () => {
        vi.useFakeTimers()
        const fetcher = vi.fn(async (q: string) => [{ username: q, displayName: q }])
        const debounced = createDebouncedMentionSearch(fetcher, MENTION_DEBOUNCE_MS)

        const first = debounced("m")
        await vi.advanceTimersByTimeAsync(MENTION_DEBOUNCE_MS - 50)
        const second = debounced("mi")
        await vi.advanceTimersByTimeAsync(MENTION_DEBOUNCE_MS - 50)
        const third = debounced("min")
        expect(fetcher).not.toHaveBeenCalled()

        await vi.advanceTimersByTimeAsync(MENTION_DEBOUNCE_MS)

        expect(fetcher).toHaveBeenCalledTimes(1)
        expect(fetcher).toHaveBeenCalledWith("min")
        // Every superseded caller settles too — with the newest result, so the
        // popup can never be left pending nor rendered from a stale keystroke.
        await expect(Promise.all([first, second, third])).resolves.toEqual([
            [{ username: "min", displayName: "min" }],
            [{ username: "min", displayName: "min" }],
            [{ username: "min", displayName: "min" }],
        ])
    })

    it("settles with an empty list when the lookup rejects", async () => {
        vi.useFakeTimers()
        const fetcher = vi.fn(async () => {
            throw new Error("boom")
        })
        const debounced = createDebouncedMentionSearch(fetcher, MENTION_DEBOUNCE_MS)

        const pending = debounced("minh")
        await vi.advanceTimersByTimeAsync(MENTION_DEBOUNCE_MS)

        await expect(pending).resolves.toEqual([])
    })

    it("runs a new lookup once the quiet period elapsed again", async () => {
        vi.useFakeTimers()
        const fetcher = vi.fn(async (q: string) => [{ username: q, displayName: q }])
        const debounced = createDebouncedMentionSearch(fetcher, MENTION_DEBOUNCE_MS)

        const first = debounced("a")
        await vi.advanceTimersByTimeAsync(MENTION_DEBOUNCE_MS)
        await first
        const second = debounced("b")
        await vi.advanceTimersByTimeAsync(MENTION_DEBOUNCE_MS)
        await second

        expect(fetcher).toHaveBeenCalledTimes(2)
        expect(fetcher).toHaveBeenNthCalledWith(2, "b")
    })
})
