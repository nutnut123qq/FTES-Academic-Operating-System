import React from "react"
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { SWRConfig } from "swr"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

/**
 * Integration — proves the search POPOVER controls actually drive the feed query.
 * Real CommunityFeed + CommunityFilterBar + SearchInput + SegmentedControl + real
 * SWR hooks; only the GraphQL query functions are spied. Asserts which control
 * causes `queryCommunitySearch` to fire with which variables.
 */

vi.mock("next-intl", () => ({
    useTranslations: () => (key: string) => key,
    useLocale: () => "vi",
}))

// HeroUI: Popover renders its content INLINE (always open) so the filter bar is
// mounted; Input/TextField forward value/onChange so typing reaches the setter.
vi.mock("@heroui/react", () => {
    const Passthrough = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>
    const Popover = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>
    Popover.Trigger = Passthrough
    Popover.Content = Passthrough
    // The row's in-place post modal: closed renders nothing, so the feed assertions stay clean.
    const Modal = ({ isOpen, children }: { isOpen?: boolean; children?: React.ReactNode }) =>
        isOpen ? <div>{children}</div> : null
    Modal.Backdrop = Passthrough
    Modal.Container = Passthrough
    Modal.Dialog = Passthrough
    Modal.CloseTrigger = () => <button type="button" />
    return {
        Popover,
        Modal,
        Spinner: () => <div />,
        Button: ({ children, onPress, "aria-label": al }: { children?: React.ReactNode; onPress?: () => void; "aria-label"?: string }) => (
            <button type="button" onClick={onPress} aria-label={al}>{children}</button>
        ),
        Typography: ({ children }: { children?: React.ReactNode }) => <span>{children}</span>,
        Skeleton: () => <div />,
        TextField: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
        Input: ({ value, onChange, placeholder }: { value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; placeholder?: string }) => (
            <input aria-label="search" value={value} onChange={onChange} placeholder={placeholder} />
        ),
        cn: (...v: Array<unknown>) => v.filter(Boolean).join(" "),
        toast: { success: vi.fn(), danger: vi.fn() },
    }
})

vi.mock("@phosphor-icons/react", () => ({ MagnifyingGlassIcon: () => <span /> }))
vi.mock("framer-motion", () => ({
    AnimatePresence: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
    motion: { ul: (p: Record<string, unknown>) => <ul {...p} /> },
}))

vi.mock("@/redux/hooks", () => ({ useAppSelector: () => ({ username: "me", email: "me@x" }) }))
vi.mock("@/i18n/navigation", () => ({ Link: ({ children }: { children?: React.ReactNode }) => <a>{children}</a> }))
vi.mock("@/components/reuseable/FtesMascot", () => ({ FtesMascot: () => <span /> }))
vi.mock("@/components/reuseable/UserAvatar", () => ({ UserAvatar: () => <span /> }))
vi.mock("@/components/features/identity", () => ({
    UserLink: () => <span />,
    useQueryFollowedUserIdsSwr: () => ({ isFollowing: () => false }),
}))
vi.mock("@/components/blocks/feed/ThreadsPostRow", () => ({ ThreadsPostRow: ({ children }: { children?: React.ReactNode }) => <div>{children}</div> }))
vi.mock("@/components/blocks/feed/PostMediaGrid", () => ({ PostMediaGrid: () => <div /> }))
vi.mock("@/components/blocks/feed/PinnedBadge", () => ({ PinnedBadge: () => <span /> }))
vi.mock("@/components/blocks/async/AsyncContent", () => ({ AsyncContent: ({ children }: { children?: React.ReactNode }) => <>{children}</> }))
vi.mock("@/components/blocks/async/InfiniteScrollSentinel", () => ({ InfiniteScrollSentinel: () => <div /> }))
vi.mock("@/components/reuseable/PostEngagementBar", () => ({
    ConfirmDialog: () => null,
    PostEngagementBar: () => <div />,
    ReportDialog: () => null,
}))
vi.mock("@/components/reuseable/PostCommentThread", () => ({ PostCommentThread: () => <div /> }))
vi.mock("@/hooks/zustand/overlay/hooks", () => ({ useCommunityComposerOverlayState: () => ({ open: vi.fn(), openQuote: vi.fn() }) }))
vi.mock("@/hooks/useRequireAuth", () => ({ useRequireAuth: () => ({ authenticated: true, requireAuth: () => true, requireAuthAsync: async () => true, guard: (a: () => void) => a }) }))
vi.mock("../hooks/useQueryPostDetailSwr", () => ({ useQueryPostCommentsSwr: () => ({ post: undefined, isLoading: false, error: undefined, mutate: vi.fn() }) }))
vi.mock("../hooks/useMutateReactPostSwr", () => ({ useMutateReactPostSwr: () => vi.fn() }))
vi.mock("../hooks/useMutateCreatePostCommentSwr", () => ({ useMutateCreatePostCommentSwr: () => vi.fn() }))
vi.mock("../CommunityPostDetail/hooks/useQueryPostMetaSwr", () => ({ useQueryPostMetaSwr: () => ({ meta: undefined, error: undefined }) }))
vi.mock("../CommunityPostDetail/hooks/useMutateReportContentSwr", () => ({ useMutateReportContentSwr: () => vi.fn() }))
vi.mock("../CommunityPostDetail/PostEditDialog", () => ({ PostEditDialog: () => null }))
vi.mock("../CommunityPostDetail/CommunityPostContent", () => ({ CommunityPostContent: () => <div /> }))
vi.mock("./hooks/useMutateFeedPostOwnerActionsSwr", () => ({ useMutateFeedPostOwnerActionsSwr: () => ({ deleteFeedPost: vi.fn(), editFeedPost: vi.fn() }) }))

// The GraphQL layer — spied. Real enums preserved.
interface SearchArgs { q?: string | null; sort?: string; postType?: string | null }
const queryCommunitySearch = vi.fn(async (_args: SearchArgs) => ({
    data: { communitySearch: { items: [], nextCursor: null } },
}))
const queryCommunityFeed = vi.fn(async (_args: unknown) => ({
    data: { feed: { items: [], nextCursor: null } },
}))
vi.mock("@/modules/api/graphql/queries/query-community-search", () => ({
    CommunitySearchSort: { Newest: "DESC", Oldest: "ASC" },
    queryCommunitySearch: (args: SearchArgs) => queryCommunitySearch(args),
}))
vi.mock("@/modules/api/graphql/queries/query-community-feed", () => ({
    FeedTab: { ForYou: "FOR_YOU", Following: "FOLLOWING", Campus: "CAMPUS", Trending: "TRENDING" },
    queryCommunityFeed: (args: unknown) => queryCommunityFeed(args),
}))

import { CommunityFeed } from "./index"

const renderFeed = () =>
    render(
        <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
            <CommunityFeed />
        </SWRConfig>,
    )

beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    queryCommunitySearch.mockClear()
    queryCommunityFeed.mockClear()
})
afterEach(() => vi.useRealTimers())

describe("community search popover — wiring to the feed", () => {
    it("typing a keyword fires communitySearch with q (debounced)", async () => {
        renderFeed()
        const input = screen.getByLabelText("search") as HTMLInputElement
        fireEvent.change(input, { target: { value: "kafka" } })
        await act(async () => { vi.advanceTimersByTime(350) })
        await waitFor(() => expect(queryCommunitySearch).toHaveBeenCalled())
        expect(queryCommunitySearch.mock.calls[0][0]).toMatchObject({ q: "kafka" })
    })

    it("toggling Oldest re-sorts the list (fires communitySearch with sort ASC)", async () => {
        renderFeed()
        const input = screen.getByLabelText("search") as HTMLInputElement
        fireEvent.change(input, { target: { value: "kafka" } })
        await act(async () => { vi.advanceTimersByTime(350) })
        fireEvent.click(screen.getByText("search.sortOldest"))
        await act(async () => { vi.advanceTimersByTime(350) })
        await waitFor(() => expect(queryCommunitySearch).toHaveBeenCalled())
        expect(queryCommunitySearch.mock.calls.at(-1)?.[0]).toMatchObject({ sort: "ASC" })
    })
})
