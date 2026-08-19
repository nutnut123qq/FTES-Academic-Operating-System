import React from "react"
import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

/**
 * Guards the RENDER CAP on the dashboard "Bài viết của tôi" section.
 *
 * The section used to render every fetched post and auto-page more through an
 * `InfiniteScrollSentinel`, which is why it swallowed the MY RESOURCE panel. The cap that
 * replaced it is invisible to a test that only asserts "rows render" — that passes just as
 * happily with all 12 rows on screen — so every case here counts ROWS, and the paging cases
 * assert whether `setSize` fired, which is the difference between revealing a post that is
 * already in the SWR cache and paying for a round-trip to show it.
 *
 * The search hook is mocked rather than driven through SWR: what is under test is the
 * slice/reveal arithmetic on top of it, not the cursor pagination it already owns (that has
 * its own coverage in `useQueryCommunitySearchSwr`).
 */

vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }))

vi.mock("@heroui/react", () => ({
    Button: ({
        children,
        onPress,
        isDisabled,
    }: {
        children?: React.ReactNode
        onPress?: () => void
        isDisabled?: boolean
    }) => (
        <button type="button" disabled={isDisabled} onClick={onPress}>
            {children}
        </button>
    ),
}))

vi.mock("@/i18n/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }))
vi.mock("@/redux/hooks", () => ({
    useAppSelector: () => ({ id: "me-1", username: "me" }),
}))
vi.mock("@/hooks/useRequireAuth", () => ({
    useRequireAuth: () => ({ authenticated: true, requireAuth: vi.fn() }),
}))
vi.mock("@/hooks/zustand/overlay/hooks", () => ({
    useCommunityComposerOverlayState: () => ({ open: vi.fn() }),
}))

// The async switch + card chrome are not what this file is about: render children straight
// through so the row count is the only thing standing between the mock data and the DOM.
vi.mock("@/components/blocks/async/AsyncContent", () => ({
    AsyncContent: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}))
vi.mock("@/components/blocks/cards/LabeledCard", () => ({
    LabeledCard: ({ children }: { children?: React.ReactNode }) => <section>{children}</section>,
}))
vi.mock("@/components/blocks/skeleton/Skeleton", () => {
    const Skeleton = () => <div data-testid="skeleton" />
    Skeleton.Typography = () => <div />
    return { Skeleton }
})
vi.mock("@/components/reuseable/FtesMascot", () => ({ FtesMascot: () => <span /> }))
vi.mock("@/components/features/community/CommunityFeed", () => ({
    CommunityFeedRow: ({ post }: { post: { id: string } }) => (
        <article data-testid="post-row">{post.id}</article>
    ),
}))

const setSize = vi.fn()
const hookState = {
    posts: [] as Array<{ id: string }>,
    isLoading: false,
    isLoadingMore: false,
    error: undefined as unknown,
    hasMore: false,
    setSize,
    mutate: vi.fn(),
}
vi.mock("@/components/features/community/hooks/useQueryCommunitySearchSwr", () => ({
    CommunitySearchSort: { Newest: "DESC", Oldest: "ASC" },
    useQueryCommunitySearchSwr: () => hookState,
}))

import { MY_POSTS_STEP, MyPosts } from "./index"

/** `n` distinct posts, so a row count maps back to which slice was rendered. */
const makePosts = (n: number) => Array.from({ length: n }, (_, i) => ({ id: `post-${i + 1}` }))

const rows = () => screen.queryAllByTestId("post-row")
const revealButton = () => screen.queryByRole("button", { name: "dashboard.loadMore" })

beforeEach(() => {
    vi.clearAllMocks()
    Object.assign(hookState, {
        posts: [],
        isLoading: false,
        isLoadingMore: false,
        error: undefined,
        hasMore: false,
    })
})

describe("MyPosts render cap", () => {
    it("renders only the first step of rows when the viewer has more posts than that", () => {
        hookState.posts = makePosts(12)
        render(<MyPosts />)

        expect(MY_POSTS_STEP).toBe(3)
        expect(rows()).toHaveLength(MY_POSTS_STEP)
        // and specifically the NEWEST three, not an arbitrary three
        expect(rows().map((row) => row.textContent)).toEqual(["post-1", "post-2", "post-3"])
        expect(revealButton()).not.toBeNull()
    })

    it("reveals the next step out of the already-fetched posts without fetching a page", () => {
        hookState.posts = makePosts(12)
        render(<MyPosts />)

        fireEvent.click(revealButton() as HTMLElement)

        expect(rows()).toHaveLength(MY_POSTS_STEP * 2)
        expect(rows()[5]?.textContent).toBe("post-6")
        // posts 4-6 were already in the cache — asking the BE for them would be wasted
        expect(setSize).not.toHaveBeenCalled()
    })

    it("keeps revealing across presses until the loaded list runs out", () => {
        hookState.posts = makePosts(12)
        render(<MyPosts />)

        fireEvent.click(revealButton() as HTMLElement)
        fireEvent.click(revealButton() as HTMLElement)
        fireEvent.click(revealButton() as HTMLElement)

        expect(rows()).toHaveLength(12)
        expect(setSize).not.toHaveBeenCalled()
        // everything loaded is on screen and the BE has no more → the button is gone
        expect(revealButton()).toBeNull()
    })

    it("fetches another page when a press runs past the loaded posts and hasMore is true", () => {
        hookState.posts = makePosts(3)
        hookState.hasMore = true
        render(<MyPosts />)

        expect(rows()).toHaveLength(3)
        fireEvent.click(revealButton() as HTMLElement)

        expect(setSize).toHaveBeenCalledTimes(1)
        // called with an updater so it stacks on SWR's current size rather than clobbering it
        expect(setSize.mock.calls[0]?.[0]).toBeTypeOf("function")
        expect((setSize.mock.calls[0]?.[0] as (n: number) => number)(2)).toBe(3)
    })

    it("hides the button when the viewer has fewer posts than one step and hasMore is false", () => {
        hookState.posts = makePosts(2)
        render(<MyPosts />)

        expect(rows()).toHaveLength(2)
        expect(revealButton()).toBeNull()
    })

    it("keeps the button while hasMore is true even with everything loaded revealed", () => {
        hookState.posts = makePosts(2)
        hookState.hasMore = true
        render(<MyPosts />)

        expect(rows()).toHaveLength(2)
        expect(revealButton()).not.toBeNull()
    })

    it("disables the button and shows the loading treatment while a page is in flight", () => {
        hookState.posts = makePosts(3)
        hookState.hasMore = true
        hookState.isLoadingMore = true
        render(<MyPosts />)

        expect(screen.queryByTestId("skeleton")).not.toBeNull()
        expect((revealButton() as HTMLButtonElement).disabled).toBe(true)

        fireEvent.click(revealButton() as HTMLElement)
        expect(setSize).not.toHaveBeenCalled()
    })
})
