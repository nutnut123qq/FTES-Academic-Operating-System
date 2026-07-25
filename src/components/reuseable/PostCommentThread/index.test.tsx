import React from "react"
import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
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
 *    none at all.
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
