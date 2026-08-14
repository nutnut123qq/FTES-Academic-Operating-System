import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

/**
 * Unit — the `@` mention typeahead (prefix lookup over `/profiles/mentionable`).
 *
 * The lookup is mocked so these pin the contract Tiptap depends on:
 *  - keystrokes are COALESCED into one request per 250ms quiet period, and every
 *    superseded caller still settles (Tiptap awaits one promise per keystroke —
 *    a dropped promise would freeze the popup, a late stale one would flicker it),
 *  - a row maps to the `MentionUser` shape (`username`, `displayName`), and rows
 *    without a username are dropped (the serialized link needs one),
 *  - a failed/forbidden lookup degrades to an empty list, never a rejection.
 *
 * It reads `/profiles/mentionable` rather than the search index on purpose: the
 * index matches whole words, so `fro` never found `frostes` and the popup only
 * ever appeared once the full username had been typed.
 */

const getMentionableUsers = vi.fn()

vi.mock("@/modules/api/rest/profile", () => ({
    getMentionableUsers: (q: string, limit?: number) => getMentionableUsers(q, limit),
}))

import {
    MENTION_DEBOUNCE_MS,
    createDebouncedMentionSearch,
    searchMentionUsers,
    type MentionUser,
} from "./mention-suggestion"

beforeEach(() => {
    getMentionableUsers.mockReset()
})

afterEach(() => {
    vi.useRealTimers()
})

describe("searchMentionUsers", () => {
    it("maps rows to the MentionUser shape", async () => {
        getMentionableUsers.mockResolvedValue([
            { userId: "u1", username: "minh-tran", displayName: "Minh Trần", avatarUrl: null },
            { userId: "u2", username: "an-nguyen", displayName: null, avatarUrl: null },
        ])

        await expect(searchMentionUsers("minh")).resolves.toEqual([
            { username: "minh-tran", displayName: "Minh Trần" },
            // displayName absent → the handle is the label (never an empty row)
            { username: "an-nguyen", displayName: "an-nguyen" },
        ] satisfies Array<MentionUser>)
        expect(getMentionableUsers).toHaveBeenCalledWith("minh", 5)
    })

    // The whole point of the endpoint swap: a few leading characters must match.
    it("looks up on a short prefix", async () => {
        getMentionableUsers.mockResolvedValue([
            { userId: "b", username: "frostes", displayName: "FrosTES", avatarUrl: null },
        ])

        await expect(searchMentionUsers("fro")).resolves.toEqual([
            { username: "frostes", displayName: "FrosTES" },
        ])
    })

    it("drops rows without a username", async () => {
        getMentionableUsers.mockResolvedValue([
            { userId: "u1", username: "", displayName: "No Handle", avatarUrl: null },
            { userId: "u2", username: "hoa-le", displayName: "Hoa Lê", avatarUrl: null },
        ])

        await expect(searchMentionUsers("h")).resolves.toEqual([
            { username: "hoa-le", displayName: "Hoa Lê" },
        ])
    })

    it("returns an empty list for a blank query and for a failed lookup", async () => {
        await expect(searchMentionUsers("   ")).resolves.toEqual([])
        expect(getMentionableUsers).not.toHaveBeenCalled()

        getMentionableUsers.mockRejectedValue(new Error("403"))
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
