import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

/**
 * Unit — the `@` mention typeahead (personalized Community ranking + profile prefix lookup).
 *
 * The lookup is mocked so these pin the contract Tiptap depends on:
 *  - keystrokes are COALESCED into one request per 250ms quiet period, and every
 *    superseded caller still settles (Tiptap awaits one promise per keystroke —
 *    a dropped promise would freeze the popup, a late stale one would flicker it),
 *  - typing only `@` immediately shows followed/frequently-interacted people,
 *  - a row maps to the `MentionUser` shape, and rows
 *    without a username are dropped (the serialized link needs one),
 *  - a failed/forbidden lookup degrades to an empty list, never a rejection.
 *
 * Prefix fill reads `/profiles/mentionable` rather than the search index on purpose: the index
 * matches whole words, so `fro` never found `frostes`. Personalized rows come from
 * `/community/mention-suggestions` and always stay ahead of global results.
 */

const getMentionableUsers = vi.fn()
const getMentionSuggestions = vi.fn()

vi.mock("@/modules/api/rest/profile", () => ({
    getMentionableUsers: (q: string, limit?: number) => getMentionableUsers(q, limit),
}))
vi.mock("@/modules/api/rest/community", () => ({
    getMentionSuggestions: (limit?: number) => getMentionSuggestions(limit),
}))

import {
    MENTION_DEBOUNCE_MS,
    createDebouncedMentionSearch,
    searchMentionUsers,
    type MentionUser,
} from "./mention-suggestion"

beforeEach(() => {
    getMentionableUsers.mockReset()
    getMentionSuggestions.mockReset()
    getMentionSuggestions.mockResolvedValue([])
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
            { userId: "u1", username: "minh-tran", displayName: "Minh Trần", avatarUrl: null },
            // displayName absent → the handle is the label (never an empty row)
            { userId: "u2", username: "an-nguyen", displayName: "an-nguyen", avatarUrl: null },
        ] satisfies Array<MentionUser>)
        expect(getMentionableUsers).toHaveBeenCalledWith("minh", 5)
        expect(getMentionSuggestions).toHaveBeenCalledWith(10)
    })

    // The whole point of the endpoint swap: a few leading characters must match.
    it("looks up on a short prefix", async () => {
        getMentionableUsers.mockResolvedValue([
            { userId: "b", username: "frostes", displayName: "FrosTES", avatarUrl: null },
        ])

        await expect(searchMentionUsers("fro")).resolves.toEqual([
            { userId: "b", username: "frostes", displayName: "FrosTES", avatarUrl: null },
        ])
    })

    it("drops rows without a username", async () => {
        getMentionableUsers.mockResolvedValue([
            { userId: "u1", username: "", displayName: "No Handle", avatarUrl: null },
            { userId: "u2", username: "hoa-le", displayName: "Hoa Lê", avatarUrl: null },
        ])

        await expect(searchMentionUsers("h")).resolves.toEqual([
            { userId: "u2", username: "hoa-le", displayName: "Hoa Lê", avatarUrl: null },
        ])
    })

    it("shows followed/frequent people immediately for a blank query", async () => {
        getMentionSuggestions.mockResolvedValue([
            {
                userId: "followed",
                username: "an",
                displayName: "An Trần",
                avatarUrl: "a.png",
                followedByMe: true,
                interactionScore: 1_000_000,
            },
            {
                userId: "frequent",
                username: "binh",
                displayName: "Bình Nguyễn",
                avatarUrl: null,
                followedByMe: false,
                interactionScore: 360,
            },
        ])

        await expect(searchMentionUsers("   ")).resolves.toEqual([
            {
                userId: "followed",
                username: "an",
                displayName: "An Trần",
                avatarUrl: "a.png",
                source: "following",
            },
            {
                userId: "frequent",
                username: "binh",
                displayName: "Bình Nguyễn",
                avatarUrl: null,
                source: "interaction",
            },
        ])
        expect(getMentionableUsers).not.toHaveBeenCalled()
    })

    it("keeps matching personalized rows first and removes duplicates from prefix search", async () => {
        getMentionSuggestions.mockResolvedValue([
            {
                userId: "u1",
                username: "minh-tran",
                displayName: "Minh Trần",
                avatarUrl: "personal.png",
                followedByMe: true,
                interactionScore: 1_000_120,
            },
        ])
        getMentionableUsers.mockResolvedValue([
            { userId: "u1", username: "minh-tran", displayName: "Minh Trần", avatarUrl: null },
            { userId: "u2", username: "minh-an", displayName: "Minh An", avatarUrl: null },
        ])

        await expect(searchMentionUsers("minh")).resolves.toEqual([
            {
                userId: "u1",
                username: "minh-tran",
                displayName: "Minh Trần",
                avatarUrl: "personal.png",
                source: "following",
            },
            { userId: "u2", username: "minh-an", displayName: "Minh An", avatarUrl: null },
        ])
    })

    it("degrades to an empty list when both lookups fail", async () => {
        getMentionSuggestions.mockRejectedValue(new Error("503"))

        getMentionableUsers.mockRejectedValue(new Error("403"))
        await expect(searchMentionUsers("minh")).resolves.toEqual([])
    })
})

describe("createDebouncedMentionSearch", () => {
    it("fires one lookup per quiet period, with the LAST query", async () => {
        vi.useFakeTimers()
        const fetcher = vi.fn(async (q: string) => [{ userId: q, username: q, displayName: q }])
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
            [{ userId: "min", username: "min", displayName: "min" }],
            [{ userId: "min", username: "min", displayName: "min" }],
            [{ userId: "min", username: "min", displayName: "min" }],
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
        const fetcher = vi.fn(async (q: string) => [{ userId: q, username: q, displayName: q }])
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
