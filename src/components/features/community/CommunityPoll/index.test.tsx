import React from "react"
import { act, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { Poll } from "../hooks/useQueryPollSwr"

/**
 * Component — {@link CommunityPoll} (`community-de-mock` task 1.5): the real-BE
 * poll wiring. The query/vote hooks and the presentation primitives are mocked so
 * the tests pin THIS component's optimistic-vote contract:
 *  - before any vote the options hide their tallies and are clickable,
 *  - a vote reveals the result immediately (optimistic +1 in the percentages,
 *    before the server revalidates),
 *  - a failed write rolls the reveal back and toasts `poll.voteFailed`,
 *  - a guest vote (`false` from the mutation) rolls back silently (the auth
 *    modal already opened) — no failure toast,
 *  - a poll the viewer already voted on (`myOptionId` from the server) starts
 *    revealed and never submits again (voted → disabled),
 *  - percentages come from the server tallies alone once `myOptionId` is truth
 *    (no double count after revalidate).
 *
 * `t` echoes the key (`key#count` when a count param rides along), so assertions
 * key off message ids.
 */

// next-intl: echo the key, exposing a count param when present.
vi.mock("next-intl", () => ({
    useTranslations:
        () =>
            (key: string, params?: Record<string, unknown>) =>
                params && "count" in params ? `${key}#${params.count}` : key,
}))

// HeroUI primitives → trivial renderers; toast captured for the rollback assert.
const toastDanger = vi.fn()
vi.mock("@heroui/react", () => ({
    Skeleton: () => <div />,
    Typography: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
    cn: (...a: Array<unknown>) => a.filter(Boolean).join(" "),
    toast: { danger: (...a: Array<unknown>) => toastDanger(...a) },
}))

// AsyncContent → children unless empty/error (skeleton path not under test here).
vi.mock("@/components/blocks/async/AsyncContent", () => ({
    AsyncContent: ({
        isEmpty,
        children,
    }: {
        isEmpty?: boolean
        children: React.ReactNode
    }) => (isEmpty ? <div data-testid="empty" /> : <>{children}</>),
}))

// The two hooks the component wires together — controllable per test.
let pollResult: {
    poll: Poll | null
    isLoading: boolean
    error: unknown
    mutate: () => void
}
const submitVote = vi.fn()
vi.mock("../hooks/useQueryPollSwr", () => ({
    useQueryPollSwr: () => pollResult,
}))
vi.mock("../hooks/useMutatePollVoteSwr", () => ({
    useMutatePollVoteSwr: () => submitVote,
}))

import { CommunityPoll } from "./index"

/** 3 + 1 = 4 server votes across two options; the viewer has not voted. */
const freshPoll = (): Poll => ({
    postId: "post-1",
    question: "Bạn thích học gì nhất?",
    closesAt: null,
    myOptionId: null,
    options: [
        { id: "opt-a", label: "Java", votes: 3 },
        { id: "opt-b", label: "SQL", votes: 1 },
    ],
})

beforeEach(() => {
    pollResult = {
        poll: freshPoll(),
        isLoading: false,
        error: undefined,
        mutate: vi.fn(),
    }
    submitVote.mockReset()
    toastDanger.mockReset()
})

afterEach(() => {
    vi.clearAllMocks()
})

describe("CommunityPoll", () => {
    it("hides tallies until the viewer votes", () => {
        render(<CommunityPoll postId="post-1" />)
        expect(screen.getByText("Java")).toBeTruthy()
        expect(screen.getByText("SQL")).toBeTruthy()
        expect(screen.queryByText(/%$/)).toBeNull()
        // total line: 4 server votes, no optimistic extra
        expect(screen.getByText("poll.totalVotes#4")).toBeTruthy()
    })

    it("reveals the result optimistically on vote (+1 before revalidate)", async () => {
        // Vote write hangs → the optimistic window stays open for the assert.
        submitVote.mockReturnValue(new Promise(() => undefined))
        render(<CommunityPoll postId="post-1" />)

        await act(async () => {
            fireEvent.click(screen.getByText("Java"))
        })

        expect(submitVote).toHaveBeenCalledWith("post-1", "opt-a")
        // 3+1 optimistic of 5 total → 80%, the other option 1 of 5 → 20%.
        expect(screen.getByText("80%")).toBeTruthy()
        expect(screen.getByText("20%")).toBeTruthy()
        expect(screen.getByText("poll.totalVotes#5")).toBeTruthy()
    })

    it("rolls the reveal back and toasts poll.voteFailed when the write fails", async () => {
        submitVote.mockRejectedValue(new Error("500"))
        render(<CommunityPoll postId="post-1" />)

        await act(async () => {
            fireEvent.click(screen.getByText("Java"))
        })

        // Reveal undone → tallies hidden again, total back to the server's 4.
        expect(screen.queryByText(/%$/)).toBeNull()
        expect(screen.getByText("poll.totalVotes#4")).toBeTruthy()
        expect(toastDanger).toHaveBeenCalledWith("poll.voteFailed")

        // The poll is votable again after the rollback.
        submitVote.mockReturnValue(new Promise(() => undefined))
        await act(async () => {
            fireEvent.click(screen.getByText("SQL"))
        })
        expect(submitVote).toHaveBeenLastCalledWith("post-1", "opt-b")
    })

    it("rolls back silently for a guest (auth modal path) — no failure toast", async () => {
        submitVote.mockResolvedValue(false)
        render(<CommunityPoll postId="post-1" />)

        await act(async () => {
            fireEvent.click(screen.getByText("Java"))
        })

        expect(screen.queryByText(/%$/)).toBeNull()
        expect(toastDanger).not.toHaveBeenCalled()
    })

    it("starts revealed and never re-submits when the server says the viewer voted", async () => {
        pollResult.poll = { ...freshPoll(), myOptionId: "opt-b" }
        render(<CommunityPoll postId="post-1" />)

        // Server tallies alone (4 total, no optimistic +1): 3/4 = 75%, 1/4 = 25%.
        expect(screen.getByText("75%")).toBeTruthy()
        expect(screen.getByText("25%")).toBeTruthy()
        expect(screen.getByText("poll.totalVotes#4")).toBeTruthy()

        await act(async () => {
            fireEvent.click(screen.getByText("Java"))
        })
        expect(submitVote).not.toHaveBeenCalled()
    })

    it("does not double-count once the server myOptionId lands after revalidate", async () => {
        // The optimistic click resolves and the server view now carries the vote:
        // myOptionId set AND voteCount already incremented.
        submitVote.mockResolvedValue(true)
        const { rerender } = render(<CommunityPoll postId="post-1" />)
        await act(async () => {
            fireEvent.click(screen.getByText("Java"))
        })

        pollResult.poll = {
            ...freshPoll(),
            myOptionId: "opt-a",
            options: [
                { id: "opt-a", label: "Java", votes: 4 },
                { id: "opt-b", label: "SQL", votes: 1 },
            ],
        }
        rerender(<CommunityPoll postId="post-1" />)

        // 4 of 5 = 80% — the local +1 must NOT stack on the server's tally (→ 5 of 6).
        expect(screen.getByText("80%")).toBeTruthy()
        expect(screen.getByText("poll.totalVotes#5")).toBeTruthy()
    })

    it("shows the empty state when no poll is discoverable", () => {
        pollResult.poll = null
        render(<CommunityPoll />)
        expect(screen.getByTestId("empty")).toBeTruthy()
    })
})
