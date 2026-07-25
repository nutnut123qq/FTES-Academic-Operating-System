import React from "react"
import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { PostComment } from "@/components/features/community/hooks/useQueryPostDetailSwr"

/**
 * Component — {@link PostCommentThread}: the per-comment affordances added on top
 * of the existing list/composer:
 *  - ACCEPT ANSWER shows only for the post author on a QUESTION post, only on
 *    TOP-LEVEL comments, and never on the comment already accepted (that one
 *    wears the badge instead),
 *  - the accept press reports the comment id back to the feature,
 *  - the comment OWNER GATE: "Sửa"/"Xoá" render only on rows whose
 *    `authorUsername` matches the signed-in viewer — a guest (no username) gets
 *    none at all,
 *  - REPORT: a signed-in viewer gets "Báo cáo" on OTHER people's comments (and
 *    replies) which opens the shared report dialog and submits
 *    `targetType: "COMMENT"`; the viewer's own comment and guests get none,
 *  - the owner gate ALSO matches on the viewer id, because surfaces without a
 *    profile join (group feed / discussion) map `authorUsername` to the raw
 *    author id — otherwise the viewer's own comment would offer "Báo cáo",
 *  - `canReportComments={false}` (threads outside the community module) drops
 *    the built-in report entry entirely.
 *
 * `t` echoes the key so assertions key off message ids.
 */

vi.mock("next-intl", () => ({
    useTranslations:
        () =>
            (key: string, params?: Record<string, unknown>) =>
                params && "name" in params ? `${key}#${params.name}` : key,
}))

vi.mock("@heroui/react", () => ({
    Button: ({
        children,
        onPress,
        isDisabled,
    }: {
        children?: React.ReactNode
        onPress?: () => void
        isDisabled?: boolean
        isPending?: boolean
    }) => (
        <button type="button" disabled={isDisabled} onClick={onPress}>
            {children}
        </button>
    ),
    Chip: Object.assign(
        ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
        { Label: ({ children }: { children: React.ReactNode }) => <span>{children}</span> },
    ),
    Skeleton: () => <div />,
    TextField: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    TextArea: (props: React.ComponentProps<"textarea">) => <textarea {...props} />,
    Typography: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
    cn: (...values: Array<unknown>) => values.filter(Boolean).join(" "),
}))

vi.mock("@phosphor-icons/react", () => ({
    ArrowClockwiseIcon: () => <span />,
    CaretUpIcon: () => <span />,
    CheckCircleIcon: () => <span />,
    XIcon: () => <span />,
}))

vi.mock("@/components/features/identity", () => ({
    UserLink: ({ displayName }: { displayName: string }) => <span>{displayName}</span>,
}))

vi.mock("@/components/reuseable/MarkdownContent", () => ({
    MarkdownContent: ({ markdown }: { markdown: string }) => <p>{markdown}</p>,
}))

vi.mock("@/components/reuseable/RichCommentEditor", () => ({
    RichCommentEditor: () => <div data-testid="composer" />,
}))

/** Mutable session flag + the shared report mutation, shared with the factories. */
const session = vi.hoisted(() => ({ authenticated: true }))
const submitReport = vi.hoisted(() => vi.fn())

vi.mock("@/hooks/useRequireAuth", () => ({
    useRequireAuth: () => ({
        authenticated: session.authenticated,
        requireAuth: () => session.authenticated,
        guard: (action: (...args: Array<unknown>) => void) => action,
    }),
}))

vi.mock("@/redux/hooks", () => ({
    // no session user in the store → the `currentUsername` prop is the only viewer
    useAppSelector: (selector: (state: { user: { user: null } }) => unknown) =>
        selector({ user: { user: null } }),
}))

vi.mock(
    "@/components/features/community/CommunityPostDetail/hooks/useMutateReportContentSwr",
    () => ({ useMutateReportContentSwr: () => submitReport }),
)

vi.mock("@/components/reuseable/PostEngagementBar/ReportDialog", () => ({
    ReportDialog: ({
        isOpen,
        onSubmit,
    }: {
        isOpen: boolean
        onSubmit: (reasonCode: string, detail?: string) => Promise<boolean>
    }) =>
        isOpen ? (
            <button
                type="button"
                data-testid="report-dialog"
                onClick={() => void onSubmit("SPAM", "spam quảng cáo")}
            >
                report
            </button>
        ) : null,
}))

vi.mock("@/components/reuseable/PostEngagementBar/ConfirmDialog", () => ({
    ConfirmDialog: ({
        isOpen,
        onConfirm,
    }: {
        isOpen: boolean
        onConfirm: () => void
    }) =>
        isOpen ? (
            <button type="button" data-testid="confirm-delete" onClick={onConfirm}>
                confirm
            </button>
        ) : null,
}))

import { PostCommentThread } from "./index"

/** Two top-level comments (the second by the viewer) + one reply. */
const comments = (): Array<PostComment> => [
    {
        id: "c-1",
        author: "Minh",
        authorUsername: "minh",
        text: "Dùng index cho cột join là được.",
        timeLabel: "2 giờ",
        replies: [
            {
                id: "r-1",
                author: "Lan",
                authorUsername: "lan",
                text: "Chuẩn luôn.",
                timeLabel: "1 giờ",
            },
        ],
    },
    {
        id: "c-2",
        author: "Bạn",
        authorUsername: "khoa",
        text: "Mình thử rồi, nhanh hơn hẳn.",
        timeLabel: "30 phút",
    },
]

/** Render the thread with the accept/owner wiring under test. */
const renderThread = (props: Partial<React.ComponentProps<typeof PostCommentThread>> = {}) =>
    render(
        <PostCommentThread
            regionId="post-comments-1"
            comments={comments()}
            isLoading={false}
            onSubmit={vi.fn().mockResolvedValue(true)}
            {...props}
        />,
    )

describe("PostCommentThread — accept answer", () => {
    it("offers accept on every top-level comment for the QUESTION author", () => {
        const onAcceptAnswer = vi.fn()
        renderThread({ canAcceptAnswer: true, onAcceptAnswer })

        const buttons = screen.getAllByText("engagement.acceptAnswer")
        // two top-level comments, the reply is NOT acceptable
        expect(buttons).toHaveLength(2)

        fireEvent.click(buttons[0])
        expect(onAcceptAnswer).toHaveBeenCalledWith("c-1")
    })

    it("hides accept when the viewer is not the QUESTION author", () => {
        renderThread({ canAcceptAnswer: false, onAcceptAnswer: vi.fn() })
        expect(screen.queryByText("engagement.acceptAnswer")).toBeNull()
    })

    it("badges the accepted comment and stops offering accept on it", () => {
        renderThread({
            canAcceptAnswer: true,
            onAcceptAnswer: vi.fn(),
            acceptedCommentId: "c-1",
        })

        expect(screen.getByText("engagement.acceptedAnswer")).toBeTruthy()
        // only the OTHER top-level comment still offers the action
        expect(screen.getAllByText("engagement.acceptAnswer")).toHaveLength(1)
    })
})

describe("PostCommentThread — comment owner gate", () => {
    it("shows edit/delete only on the viewer's own comment", () => {
        renderThread({
            currentUsername: "khoa",
            onEditComment: vi.fn().mockResolvedValue(true),
            onDeleteComment: vi.fn(),
        })

        expect(screen.getAllByText("engagement.edit")).toHaveLength(1)
        expect(screen.getAllByText("engagement.delete")).toHaveLength(1)
    })

    it("shows nothing to a guest (no username)", () => {
        renderThread({
            onEditComment: vi.fn().mockResolvedValue(true),
            onDeleteComment: vi.fn(),
        })

        expect(screen.queryByText("engagement.edit")).toBeNull()
        expect(screen.queryByText("engagement.delete")).toBeNull()
    })

    it("deletes the viewer's comment through the confirm dialog", () => {
        const onDeleteComment = vi.fn()
        renderThread({ currentUsername: "khoa", onDeleteComment })

        fireEvent.click(screen.getByText("engagement.delete"))
        fireEvent.click(screen.getByTestId("confirm-delete"))
        expect(onDeleteComment).toHaveBeenCalledWith("c-2")
    })
})

describe("PostCommentThread — report a comment", () => {
    beforeEach(() => {
        session.authenticated = true
        submitReport.mockReset().mockResolvedValue(true)
    })

    it("offers report on other members' comments and replies, never on the viewer's own", () => {
        renderThread({ currentUsername: "khoa" })

        // "c-1" (Minh) + "r-1" (Lan) — "c-2" is the viewer's own comment
        expect(screen.getAllByText("engagement.report")).toHaveLength(2)
    })

    it("hides report on the viewer's own comment", () => {
        renderThread({
            currentUsername: "khoa",
            comments: [
                {
                    id: "c-2",
                    author: "Bạn",
                    authorUsername: "khoa",
                    text: "Mình thử rồi, nhanh hơn hẳn.",
                    timeLabel: "30 phút",
                },
            ],
        })

        expect(screen.queryByText("engagement.report")).toBeNull()
    })

    it("hides report from guests", () => {
        session.authenticated = false
        renderThread()

        expect(screen.queryByText("engagement.report")).toBeNull()
    })

    it("opens the dialog and reports the comment as targetType COMMENT", async () => {
        renderThread({ currentUsername: "khoa" })

        // dialog stays closed until the row action is pressed
        expect(screen.queryByTestId("report-dialog")).toBeNull()
        fireEvent.click(screen.getAllByText("engagement.report")[0])

        const dialogs = screen.getAllByTestId("report-dialog")
        expect(dialogs).toHaveLength(1)
        fireEvent.click(dialogs[0])

        expect(submitReport).toHaveBeenCalledWith("COMMENT", "c-1", "SPAM", "spam quảng cáo")
    })

    it("lets the surface override the report submission", () => {
        const onReportComment = vi.fn().mockResolvedValue(true)
        renderThread({ currentUsername: "khoa", onReportComment })

        fireEvent.click(screen.getAllByText("engagement.report")[0])
        fireEvent.click(screen.getByTestId("report-dialog"))

        expect(onReportComment).toHaveBeenCalledWith("c-1", "SPAM", "spam quảng cáo")
        expect(submitReport).not.toHaveBeenCalled()
    })

    it("hides report on the viewer's OWN comment when the surface maps author to the raw id", () => {
        // group feed / discussion: no profile join → `authorUsername` IS the author id
        renderThread({
            currentUserId: "11111111-2222-3333-4444-555555555555",
            comments: [
                {
                    id: "c-9",
                    author: "11111111-2222-3333-4444-555555555555",
                    authorUsername: "11111111-2222-3333-4444-555555555555",
                    text: "Bài của mình.",
                    timeLabel: "5 phút",
                    replies: [
                        {
                            id: "r-9",
                            author: "99999999-8888-7777-6666-555555555555",
                            authorUsername: "99999999-8888-7777-6666-555555555555",
                            text: "Của người khác.",
                            timeLabel: "1 phút",
                        },
                    ],
                },
            ],
        })

        // only the OTHER member's reply may be reported
        expect(screen.getAllByText("engagement.report")).toHaveLength(1)
    })

    it("drops the built-in report entry for threads outside the community module", () => {
        // group discussion comments live in their own table — a `targetType: "COMMENT"`
        // report would carry an id the moderator cannot resolve
        renderThread({ currentUsername: "khoa", canReportComments: false })

        expect(screen.queryByText("engagement.report")).toBeNull()
    })

    it("still reports when the surface wired its own handler, opt-out or not", () => {
        const onReportComment = vi.fn().mockResolvedValue(true)
        renderThread({ currentUsername: "khoa", canReportComments: false, onReportComment })

        fireEvent.click(screen.getAllByText("engagement.report")[0])
        fireEvent.click(screen.getByTestId("report-dialog"))

        expect(onReportComment).toHaveBeenCalledWith("c-1", "SPAM", "spam quảng cáo")
    })
})
