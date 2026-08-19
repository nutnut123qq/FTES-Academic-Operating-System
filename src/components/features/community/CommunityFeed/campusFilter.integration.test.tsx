import React from "react"
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { SWRConfig } from "swr"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { CampusView } from "@/modules/api/rest/community"

/**
 * Integration — the CAMPUS tab's campus picker actually drives the feed query.
 *
 * The tab used to be silently locked to the viewer's own campus: `useQueryCommunityFeedSwr`
 * has always accepted a `campus` argument, but nothing on the page could set it, so a reader
 * could never look at another campus and a reader with no campus on their profile saw an empty
 * feed forever. What is pinned here is the wiring, not the pixels:
 *
 *  - the control shows up ONLY on the campus tab (mirror of the sort control on trending),
 *  - the DEFAULT choice sends `campus: undefined` — the BE's profile-campus fallback is the only
 *    implementation of "my campus"; the client must not re-derive it,
 *  - picking a campus sends THAT code (and refetches from page 1, i.e. with no cursor),
 *  - the empty state splits: the profile advice survives only in the default mode, while an
 *    explicitly picked campus gets a message that names it.
 *
 * Real CommunityFeed + CampusPicker + real SWR; only the GraphQL layer, the campus reference
 * read and the HeroUI/Phosphor primitives are stubbed. `t` echoes the key (with interpolated
 * values appended) so assertions key off message ids.
 */

/** Mutable across tests so the locale-dependent labelling can be exercised both ways. */
const intl = vi.hoisted(() => ({ locale: "vi" }))

vi.mock("next-intl", () => ({
    useTranslations: () => (key: string, values?: Record<string, unknown>) =>
        values ? `${key}|${Object.values(values).join(",")}` : key,
    useLocale: () => intl.locale,
}))

// HeroUI: Popover + Dropdown render their content INLINE (always open) so both the filter bar
// and the campus menu are mounted; the menu turns each item into a real button that fires the
// menu's `onAction` with the item id, which is the campus CODE the picker selects on.
vi.mock("@heroui/react", () => {
    const Passthrough = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>
    const Popover = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>
    Popover.Trigger = Passthrough
    Popover.Content = Passthrough
    const Modal = ({ isOpen, children }: { isOpen?: boolean; children?: React.ReactNode }) =>
        isOpen ? <div>{children}</div> : null
    Modal.Backdrop = Passthrough
    Modal.Container = Passthrough
    Modal.Dialog = Passthrough
    Modal.CloseTrigger = () => <button type="button" />
    return {
        Popover,
        Modal,
        Dropdown: Passthrough,
        DropdownTrigger: ({ children }: { children?: React.ReactNode }) => (
            <div data-testid="campus-trigger">{children}</div>
        ),
        DropdownPopover: Passthrough,
        DropdownMenu: ({
            onAction,
            children,
            "aria-label": ariaLabel,
        }: {
            onAction: (key: string) => void
            children?: React.ReactNode
            "aria-label"?: string
        }) => (
            <div role="menu" aria-label={ariaLabel}>
                {React.Children.map(children, (child) => {
                    if (!React.isValidElement(child)) return child
                    const item = child as React.ReactElement<{
                        id: string
                        children?: React.ReactNode
                    }>
                    return (
                        <button
                            type="button"
                            data-testid={`campus-option-${item.props.id}`}
                            onClick={() => onAction(item.props.id)}
                        >
                            {item.props.children}
                        </button>
                    )
                })}
            </div>
        ),
        DropdownItem: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
        Spinner: () => <div />,
        Button: ({
            children,
            onPress,
            "aria-label": al,
        }: {
            children?: React.ReactNode
            onPress?: () => void
            "aria-label"?: string
        }) => (
            <button type="button" onClick={onPress} aria-label={al}>
                {children}
            </button>
        ),
        Typography: ({ children }: { children?: React.ReactNode }) => <span>{children}</span>,
        Skeleton: () => <div />,
        TextField: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
        Input: ({
            value,
            onChange,
        }: {
            value: string
            onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
        }) => <input aria-label="search" value={value} onChange={onChange} />,
        cn: (...v: Array<unknown>) => v.filter(Boolean).join(" "),
        toast: { success: vi.fn(), danger: vi.fn() },
    }
})

vi.mock("@phosphor-icons/react", () => ({
    MagnifyingGlassIcon: () => <span />,
    CaretDownIcon: () => <span />,
    MapPinIcon: () => <span />,
}))
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
// Renders the EMPTY branch as plain text so the two campus empty states are assertable.
vi.mock("@/components/blocks/async/AsyncContent", () => ({
    AsyncContent: ({
        isEmpty,
        emptyContent,
        children,
    }: {
        isEmpty?: boolean
        emptyContent?: { title?: React.ReactNode; description?: React.ReactNode }
        children?: React.ReactNode
    }) =>
        isEmpty && emptyContent ? (
            <div data-testid="empty">
                <span>{emptyContent.title}</span>
                <span>{emptyContent.description}</span>
            </div>
        ) : (
            <>{children}</>
        ),
}))
vi.mock("@/components/blocks/async/InfiniteScrollSentinel", () => ({ InfiniteScrollSentinel: () => <div /> }))
vi.mock("@/components/reuseable/PostEngagementBar", () => ({
    ConfirmDialog: () => null,
    PostEngagementBar: () => <div />,
    ReportDialog: () => null,
}))
vi.mock("@/components/reuseable/PostCommentThread", () => ({ PostCommentThread: () => <div /> }))
vi.mock("@/hooks/zustand/overlay/hooks", () => ({ useCommunityComposerOverlayState: () => ({ open: vi.fn(), openQuote: vi.fn() }) }))
vi.mock("@/hooks/useRequireAuth", () => ({ useRequireAuth: () => ({ authenticated: true, requireAuth: () => true, guard: (a: () => void) => a }) }))
vi.mock("../hooks/useQueryPostDetailSwr", () => ({ useQueryPostCommentsSwr: () => ({ post: undefined, isLoading: false, error: undefined, mutate: vi.fn() }) }))
vi.mock("../hooks/useMutateReactPostSwr", () => ({ useMutateReactPostSwr: () => vi.fn() }))
vi.mock("../hooks/useMutateCreatePostCommentSwr", () => ({ useMutateCreatePostCommentSwr: () => vi.fn() }))
vi.mock("../CommunityPostDetail/hooks/useQueryPostMetaSwr", () => ({ useQueryPostMetaSwr: () => ({ meta: undefined, error: undefined }) }))
vi.mock("../CommunityPostDetail/hooks/useMutateReportContentSwr", () => ({ useMutateReportContentSwr: () => vi.fn() }))
vi.mock("../CommunityPostDetail/PostEditDialog", () => ({ PostEditDialog: () => null }))
vi.mock("../CommunityPostDetail/CommunityPostContent", () => ({ CommunityPostContent: () => <div /> }))
vi.mock("./hooks/useMutateFeedPostOwnerActionsSwr", () => ({ useMutateFeedPostOwnerActionsSwr: () => ({ deleteFeedPost: vi.fn(), editFeedPost: vi.fn() }) }))

/** Reference data, deliberately OUT of `sortOrder` so the picker's ordering is observable. */
const campus = (over: Partial<CampusView> & Pick<CampusView, "code" | "name">): CampusView => ({
    id: over.code,
    nameEn: null,
    region: null,
    active: true,
    sortOrder: 0,
    ...over,
})
const CAMPUSES: Array<CampusView> = [
    campus({ code: "HCM", name: "FPT Hồ Chí Minh", nameEn: "FPT Ho Chi Minh City", sortOrder: 2 }),
    campus({ code: "HN", name: "FPT Hà Nội", nameEn: "FPT Hanoi", sortOrder: 1 }),
]
vi.mock("../hooks/useQueryCampusesSwr", () => ({
    useQueryCampusesSwr: () => ({ campuses: CAMPUSES, isLoading: false, error: undefined }),
}))

// The GraphQL layer — spied. Real enums preserved.
interface FeedArgs { tab: string; page: { limit: number; cursor?: string }; campus?: string }
const queryCommunityFeed = vi.fn(async (args: FeedArgs) => {
    void args // the response never depends on them; the ARGS are what the assertions read
    return { data: { feed: { items: [], nextCursor: null } } }
})
vi.mock("@/modules/api/graphql/queries/query-community-search", () => ({
    CommunitySearchSort: { Newest: "DESC", Oldest: "ASC" },
    queryCommunitySearch: async () => ({ data: { communitySearch: { items: [], nextCursor: null } } }),
}))
vi.mock("@/modules/api/graphql/queries/query-community-feed", () => ({
    FeedTab: { ForYou: "FOR_YOU", Following: "FOLLOWING", Campus: "CAMPUS", Trending: "TRENDING" },
    queryCommunityFeed: (args: FeedArgs) => queryCommunityFeed(args),
}))

import { CommunityFeed } from "./index"

const renderFeed = (tab: "campus" | "forYou" = "campus") =>
    render(
        <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
            <CommunityFeed tab={tab} />
        </SWRConfig>,
    )

/** Waits for the feed read to settle, then returns the args of its LAST call. */
const lastFeedArgs = async (): Promise<FeedArgs> => {
    await waitFor(() => expect(queryCommunityFeed).toHaveBeenCalled())
    return queryCommunityFeed.mock.calls.at(-1)?.[0] as FeedArgs
}

beforeEach(() => {
    intl.locale = "vi"
    queryCommunityFeed.mockClear()
})
afterEach(() => vi.clearAllMocks())

describe("campus feed — the campus picker", () => {
    it("renders ONLY on the campus tab", async () => {
        const { unmount } = renderFeed("campus")
        await lastFeedArgs()
        expect(screen.getByTestId("campus-trigger")).toBeTruthy()
        expect(screen.getByRole("menu", { name: "feed.campusFilterLabel" })).toBeTruthy()
        unmount()

        renderFeed("forYou")
        await lastFeedArgs()
        expect(screen.queryByTestId("campus-trigger")).toBeNull()
    })

    it("lists the campuses in sortOrder under a 'my campus' default entry", async () => {
        renderFeed("campus")
        await lastFeedArgs()
        const labels = Array.from(
            screen.getByRole("menu").querySelectorAll("button"),
        ).map((button) => button.textContent)
        expect(labels).toEqual(["feed.campusMine", "FPT Hà Nội", "FPT Hồ Chí Minh"])
    })

    it("labels each campus for the active locale (nameEn on en, name on vi)", async () => {
        intl.locale = "en"
        renderFeed("campus")
        await lastFeedArgs()
        expect(screen.getByTestId("campus-option-HN").textContent).toBe("FPT Hanoi")
    })

    it("defaults to NO campus argument so the BE keeps its profile-campus fallback", async () => {
        renderFeed("campus")
        const args = await lastFeedArgs()
        expect(args.tab).toBe("CAMPUS")
        expect(args.campus).toBeUndefined()
    })

    it("picking a campus sends THAT code and refetches from page 1", async () => {
        renderFeed("campus")
        await lastFeedArgs()
        await act(async () => {
            fireEvent.click(screen.getByTestId("campus-option-HN"))
        })
        await waitFor(() => expect(lastFeedArgs()).resolves.toMatchObject({ campus: "HN" }))
        const args = await lastFeedArgs()
        expect(args.campus).toBe("HN")
        // page 1 = no cursor; the campus is part of the SWR key, so paging restarts
        expect(args.page.cursor).toBeUndefined()
    })

    it("going back to 'my campus' restores the default scope", async () => {
        renderFeed("campus")
        await lastFeedArgs()
        await act(async () => {
            fireEvent.click(screen.getByTestId("campus-option-HN"))
        })
        await waitFor(() => expect(lastFeedArgs()).resolves.toMatchObject({ campus: "HN" }))
        await act(async () => {
            fireEvent.click(screen.getByTestId("campus-option-__none"))
        })
        // The default key was already fetched, so SWR serves it from cache rather than
        // re-requesting — the observable proof of the switch is the feed reverting to the
        // default (profile-fallback) scope, which is what its empty state reports.
        await waitFor(async () =>
            expect((await screen.findByTestId("empty")).textContent).toContain(
                "feed.campusEmptyHint",
            ),
        )
        expect(queryCommunityFeed.mock.calls.map((call) => call[0].campus)).toEqual([
            undefined,
            "HN",
        ])
    })
})

describe("campus feed — the empty state depends on WHO chose the campus", () => {
    it("keeps the 'set your campus in your profile' hint while no campus is picked", async () => {
        renderFeed("campus")
        await lastFeedArgs()
        const empty = await screen.findByTestId("empty")
        expect(empty.textContent).toContain("feed.campusEmpty")
        expect(empty.textContent).toContain("feed.campusEmptyHint")
    })

    it("names the picked campus instead of pointing at the profile", async () => {
        renderFeed("campus")
        await act(async () => {
            fireEvent.click(screen.getByTestId("campus-option-HN"))
        })
        await waitFor(() => expect(lastFeedArgs()).resolves.toMatchObject({ campus: "HN" }))
        const empty = await screen.findByTestId("empty")
        // the campus is NAMED, with the same wording the option carried…
        expect(empty.textContent).toContain("feed.campusPickedEmpty|FPT Hà Nội")
        expect(empty.textContent).toContain("feed.campusPickedEmptyHint")
        // …and the profile advice is gone — their profile is irrelevant to a campus they asked for
        expect(empty.textContent).not.toContain("feed.campusEmptyHint")
    })
})
