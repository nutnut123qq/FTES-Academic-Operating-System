import React from "react"
import { fireEvent, render, screen, within } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { CommunityPost } from "../hooks/useQueryCommunityFeedSwr"

/**
 * Component — the community FEED row's ⋯ overflow menu (the detail page already
 * had one; the row did not).
 *
 * The menu itself is the shared {@link PostActionsMenu} (its own gate is covered
 * in `PostActionsMenu.test.tsx`), so what is pinned here is what the ROW decides
 * and passes down:
 *  - the author of the row gets "Sửa" + "Xoá",
 *  - anybody else gets only "Báo cáo" — a viewer with a different username must
 *    never see the owner entries,
 *  - a guest is bounced by the auth guard instead of getting the report dialog,
 *  - confirming "Xoá" hands the post id to the feed delete write (whose optimistic
 *    removal + rollback are covered in `useMutateFeedPostOwnerActionsSwr.test.tsx`).
 *
 * `t` echoes the key, so assertions key off message ids.
 */

vi.mock("next-intl", () => ({
    useTranslations: () => (key: string) => key,
    useLocale: () => "vi",
}))

// HeroUI primitives → trivial renderers. `Dropdown.Item` becomes a real button so
// the entries are queryable without React Aria's overlay machinery, and `Modal`
// honours `isOpen` so a closed dialog really renders nothing.
vi.mock("@heroui/react", () => {
    const Passthrough = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>
    const Dropdown = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>
    Dropdown.Popover = Passthrough
    Dropdown.Menu = Passthrough
    Dropdown.Section = Passthrough
    Dropdown.Item = ({
        id,
        textValue,
        onPress,
        children,
    }: {
        id: string
        textValue: string
        onPress?: () => void
        children?: React.ReactNode
    }) => (
        <button type="button" data-testid={`item-${id}`} aria-label={textValue} onClick={onPress}>
            {children}
        </button>
    )
    const Modal = ({ isOpen, children }: { isOpen?: boolean; children?: React.ReactNode }) =>
        isOpen ? <div data-testid="modal">{children}</div> : null
    Modal.Backdrop = Passthrough
    Modal.Container = Passthrough
    Modal.Dialog = Passthrough
    Modal.Header = Passthrough
    Modal.Body = Passthrough
    Modal.Footer = Passthrough
    return {
        Dropdown,
        Modal,
        // only the props the assertions need reach the DOM — forwarding HeroUI's own
        // (isIconOnly / isPending / variant …) would just log unknown-attribute warnings
        Button: ({
            children,
            onPress,
            "aria-label": ariaLabel,
        }: {
            children?: React.ReactNode
            onPress?: () => void
            "aria-label"?: string
        }) => (
            <button type="button" onClick={onPress} aria-label={ariaLabel}>
                {children}
            </button>
        ),
        Label: ({ children }: { children?: React.ReactNode }) => <span>{children}</span>,
        Typography: ({ children }: { children?: React.ReactNode }) => <span>{children}</span>,
        Skeleton: () => <div />,
        Radio: Passthrough,
        RadioGroup: Passthrough,
        TextArea: () => <textarea />,
        TextField: Passthrough,
        Input: () => <input />,
        cn: (...values: Array<unknown>) => values.filter(Boolean).join(" "),
        toast: { success: vi.fn(), danger: vi.fn() },
    }
})

vi.mock("@phosphor-icons/react", () => ({
    DotsThreeIcon: () => <span />,
    PencilSimpleIcon: () => <span />,
    TrashIcon: () => <span />,
    FlagIcon: () => <span />,
    HeartIcon: () => <span />,
    ChatCircleIcon: () => <span />,
    ShareNetworkIcon: () => <span />,
    LinkSimpleIcon: () => <span />,
    PaperPlaneTiltIcon: () => <span />,
    RepeatIcon: () => <span />,
}))

// Presentation the gate does not depend on.
vi.mock("@/components/blocks/buttons/SaveButton", () => ({ SaveButton: () => <span /> }))
vi.mock("@/components/reuseable/FtesMascot", () => ({ FtesMascot: () => <span /> }))
vi.mock("@/components/features/identity", () => ({ UserLink: () => <span /> }))
vi.mock("@/components/blocks/feed/PostMediaGrid", () => ({ PostMediaGrid: () => <div /> }))
vi.mock("@/components/reuseable/PostCommentThread", () => ({ PostCommentThread: () => <div /> }))
vi.mock("@/components/blocks/async/AsyncContent", () => ({
    AsyncContent: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}))
vi.mock("@/components/blocks/async/InfiniteScrollSentinel", () => ({
    InfiniteScrollSentinel: () => <div />,
}))
vi.mock("@/i18n/navigation", () => ({
    Link: ({ children }: { children?: React.ReactNode }) => <a>{children}</a>,
}))
vi.mock("../CommunityFilterBar", () => ({ CommunityFilterBar: () => <div /> }))
vi.mock("../CommunityPostDetail/PostEditDialog", () => ({
    PostEditDialog: ({ isOpen }: { isOpen: boolean }) =>
        isOpen ? <div data-testid="edit-dialog" /> : null,
}))

// The viewer — drives the owner gate.
let currentUser: { id: string; username: string } | null = null
vi.mock("@/redux/hooks", () => ({
    useAppSelector: (selector: (state: unknown) => unknown) =>
        selector({ user: { user: currentUser } }),
}))

// Auth guard: signed-in runs the action, a guest is bounced (modal opens elsewhere).
let authenticated = true
const bounced = vi.fn()
vi.mock("@/hooks/useRequireAuth", () => ({
    useRequireAuth: () => ({
        authenticated,
        requireAuth: () => authenticated,
        guard:
            (action: (...args: Array<unknown>) => void) =>
                (...args: Array<unknown>) => {
                    if (!authenticated) {
                        bounced()
                        return
                    }
                    action(...args)
                },
    }),
}))

// Data + write hooks the row wires together.
const deleteFeedPost = vi.fn()
const editFeedPost = vi.fn()
const submitReport = vi.fn()
vi.mock("./hooks/useMutateFeedPostOwnerActionsSwr", () => ({
    useMutateFeedPostOwnerActionsSwr: () => ({ deleteFeedPost, editFeedPost }),
}))
vi.mock("../CommunityPostDetail/hooks/useMutateReportContentSwr", () => ({
    useMutateReportContentSwr: () => submitReport,
}))
vi.mock("../CommunityPostDetail/hooks/useQueryPostMetaSwr", () => ({
    useQueryPostMetaSwr: () => ({ meta: undefined, isLoading: false, error: undefined }),
}))
vi.mock("../hooks/useQueryPostDetailSwr", () => ({
    useQueryPostCommentsSwr: () => ({ post: undefined, isLoading: false, error: undefined, mutate: vi.fn() }),
}))
vi.mock("../hooks/useMutateReactPostSwr", () => ({ useMutateReactPostSwr: () => vi.fn() }))
vi.mock("../hooks/useMutateCreatePostCommentSwr", () => ({
    useMutateCreatePostCommentSwr: () => vi.fn(),
}))
vi.mock("../hooks/useQueryCommunityFeedSwr", () => ({
    useQueryCommunityFeedSwr: () => ({
        posts: [],
        isLoading: false,
        isLoadingMore: false,
        error: undefined,
        hasMore: false,
        size: 1,
        setSize: vi.fn(),
        mutate: vi.fn(),
    }),
}))
vi.mock("../hooks/useQueryCommunitySearchSwr", () => ({
    useQueryCommunitySearchSwr: () => ({ active: false, posts: [] }),
    CommunitySearchSort: { Newest: "NEWEST" },
}))
vi.mock("@/hooks/zustand/overlay/hooks", () => ({
    useCommunityComposerOverlayState: () => ({ open: vi.fn(), openQuote: vi.fn() }),
}))

import { CommunityFeedRow } from "./index"

const row: CommunityPost = {
    id: "p1",
    author: "Minh",
    authorUsername: "minh",
    authorId: "minh-id",
    pinned: false,
    timeLabel: "2 giờ",
    title: "Tiêu đề",
    snippet: "Trích đoạn",
    likes: 0,
    liked: false,
    comments: 0,
    media: [],
}

beforeEach(() => {
    currentUser = null
    authenticated = true
    deleteFeedPost.mockReset()
    submitReport.mockReset()
    bounced.mockReset()
})

describe("CommunityFeedRow — ⋯ menu", () => {
    it("gives the author Sửa + Xoá on the feed row", () => {
        currentUser = { id: "u1", username: "minh" }
        render(<CommunityFeedRow post={row} />)

        expect(screen.getByTestId("item-edit")).toBeTruthy()
        expect(screen.getByTestId("item-delete")).toBeTruthy()
        expect(screen.queryByTestId("item-report")).toBeNull()
    })

    it("gives another signed-in viewer only Báo cáo", () => {
        currentUser = { id: "u2", username: "lan" }
        render(<CommunityFeedRow post={row} />)

        expect(screen.queryByTestId("item-edit")).toBeNull()
        expect(screen.queryByTestId("item-delete")).toBeNull()
        expect(screen.getByTestId("item-report")).toBeTruthy()
    })

    it("never shows the owner entries to a guest", () => {
        currentUser = null
        authenticated = false
        render(<CommunityFeedRow post={row} />)

        expect(screen.queryByTestId("item-edit")).toBeNull()
        expect(screen.queryByTestId("item-delete")).toBeNull()

        // the report entry is there, but pressing it hits the auth guard instead
        // of opening the dialog
        fireEvent.click(screen.getByTestId("item-report"))
        expect(bounced).toHaveBeenCalledTimes(1)
        expect(screen.queryByText("engagement.reportTitle")).toBeNull()
    })

    it("opens the report dialog for a signed-in non-owner", () => {
        currentUser = { id: "u2", username: "lan" }
        render(<CommunityFeedRow post={row} />)

        fireEvent.click(screen.getByTestId("item-report"))
        expect(screen.getByText("engagement.reportTitle")).toBeTruthy()
    })

    it("confirms before deleting and hands the post id to the feed delete write", () => {
        currentUser = { id: "u1", username: "minh" }
        render(<CommunityFeedRow post={row} />)

        // nothing is deleted on the menu press alone — the confirm comes first
        fireEvent.click(screen.getByTestId("item-delete"))
        expect(deleteFeedPost).not.toHaveBeenCalled()
        expect(screen.getByText("engagement.deletePostTitle")).toBeTruthy()

        // the confirm button lives in the dialog ("Xoá" also labels the menu entry)
        fireEvent.click(within(screen.getByTestId("modal")).getByText("engagement.delete"))
        expect(deleteFeedPost).toHaveBeenCalledWith("p1")
    })

    it("keeps the editor shut until the raw body arrives", () => {
        currentUser = { id: "u1", username: "minh" }
        render(<CommunityFeedRow post={row} />)

        // metadata (the raw markdown) has not landed → the dialog must not open on
        // the truncated snippet, which a save would write over the real body
        fireEvent.click(screen.getByTestId("item-edit"))
        expect(screen.queryByTestId("edit-dialog")).toBeNull()
    })
})
