import React from "react"
import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { CommunitySearchCriteria } from "../hooks/useQueryCommunitySearchSwr"

/**
 * Component — {@link CommunityPollList} (`/community/poll`). Đây là hồi quy của lỗi
 * "trang Poll chỉ mở được ĐÚNG MỘT poll": trang cũ quét 20 item đầu của feed For You rồi
 * lấy bài POLL đầu tiên, nên có 3 poll vẫn chỉ hiện 1. Hai điều được ghim ở đây:
 *  - nhiều poll ⇒ nhiều thẻ, đúng thứ tự hook trả về (không còn cắt còn 1),
 *  - việc lọc theo kind xảy ra Ở SERVER (`postType: "POLL"`), không phải bới trong feed.
 */

vi.mock("next-intl", () => ({
    useTranslations: () => (key: string) => key,
}))

vi.mock("@heroui/react", () => ({
    Skeleton: () => <div />,
    Typography: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
    cn: (...a: Array<unknown>) => a.filter(Boolean).join(" "),
}))

// AsyncContent → empty state hoặc children (nhánh loading/lỗi không nằm trong phạm vi test).
vi.mock("@/components/blocks/async/AsyncContent", () => ({
    AsyncContent: ({
        isEmpty,
        emptyContent,
        children,
    }: {
        isEmpty?: boolean
        emptyContent?: { title: string }
        children: React.ReactNode
    }) => (isEmpty ? <div data-testid="empty">{emptyContent?.title}</div> : <>{children}</>),
}))

const sentinelProps = vi.fn()
vi.mock("@/components/blocks/async/InfiniteScrollSentinel", () => ({
    InfiniteScrollSentinel: (props: { onReach: () => void; disabled?: boolean }) => {
        sentinelProps(props)
        return <div data-testid="sentinel" />
    },
}))

// Thẻ poll thật đã có test riêng — ở đây chỉ cần biết nó được render với postId nào.
vi.mock("./index", () => ({
    CommunityPoll: ({ postId }: { postId: string }) => <div data-testid="poll">{postId}</div>,
    PollSkeleton: () => <div />,
}))

const searchCriteria = vi.fn()
let searchResult: {
    posts: Array<{ id: string }>
    isLoading: boolean
    isLoadingMore: boolean
    error: unknown
    hasMore: boolean
    setSize: (updater: (current: number) => number) => void
    mutate: () => void
}
vi.mock("../hooks/useQueryCommunitySearchSwr", () => ({
    CommunitySearchSort: { Newest: "DESC", Oldest: "ASC" },
    useQueryCommunitySearchSwr: (criteria: CommunitySearchCriteria) => {
        searchCriteria(criteria)
        return searchResult
    },
}))

import { CommunityPollList } from "./PollList"

const setSize = vi.fn()

beforeEach(() => {
    searchResult = {
        posts: [{ id: "post-1" }, { id: "post-2" }, { id: "post-3" }],
        isLoading: false,
        isLoadingMore: false,
        error: undefined,
        hasMore: false,
        setSize,
        mutate: vi.fn(),
    }
    searchCriteria.mockReset()
    sentinelProps.mockReset()
    setSize.mockReset()
})

describe("CommunityPollList", () => {
    it("renders EVERY poll, newest first — not just the first one found", () => {
        render(<CommunityPollList />)
        const rendered = screen.getAllByTestId("poll").map((node) => node.textContent)
        expect(rendered).toEqual(["post-1", "post-2", "post-3"])
    })

    it("filters by kind ON THE SERVER via communitySearch(postType: POLL)", () => {
        render(<CommunityPollList />)
        expect(searchCriteria).toHaveBeenCalledWith({
            q: "",
            sort: "DESC",
            postType: "POLL",
        })
    })

    it("shows the empty state when no poll exists at all", () => {
        searchResult.posts = []
        render(<CommunityPollList />)
        expect(screen.getByTestId("empty").textContent).toBe("poll.empty")
    })

    it("keeps paging while the BE has more pages, and stops when it does not", () => {
        searchResult.hasMore = true
        const { unmount } = render(<CommunityPollList />)
        expect(sentinelProps).toHaveBeenLastCalledWith(
            expect.objectContaining({ disabled: false }),
        )
        sentinelProps.mock.calls[0][0].onReach()
        expect(setSize).toHaveBeenCalledTimes(1)
        unmount()

        searchResult.hasMore = false
        render(<CommunityPollList />)
        expect(sentinelProps).toHaveBeenLastCalledWith(
            expect.objectContaining({ disabled: true }),
        )
    })
})
