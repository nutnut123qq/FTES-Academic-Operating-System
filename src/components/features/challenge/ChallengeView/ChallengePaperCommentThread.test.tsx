import React from "react"
import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

/**
 * Component — {@link ChallengePaperCommentThread}: the copy a PE paper's discussion shows
 * when it has nothing to show.
 *
 * The shared {@link import("@/components/reuseable/PostCommentThread").PostCommentThread}
 * is written for a community POST, and this adapter used to take its defaults whole: a
 * failed comment read on a challenge rendered "This post no longer exists or was removed",
 * which names the wrong object AND asserts a deletion. Both halves of the fix are pinned
 * here, through the REAL thread + error block (only the data hooks are stubbed), because
 * the value of the change is precisely that the string travels the whole way:
 *
 * 1. **Paper wording, not post wording**, for every state that names the thing —
 *    empty, 404, 410, 403.
 * 2. **A 404 must not read as a deletion.** The comment endpoint 404s on any environment
 *    whose BE predates `/challenges/{id}/comments`; the challenge is plainly there on the
 *    page, so the copy stops at "couldn't load" and — unlike the old `notFound` branch —
 *    offers the retry that starts working the day the endpoint ships. A 410 (or a GraphQL
 *    `NOT_FOUND`) is the server actually saying the record is gone, and keeps the
 *    definite wording with no retry.
 *
 * `t` echoes `namespace.key`, so an assertion naming `challenge.paper.comments.*` proves
 * the paper copy won and `communityHub.engagement.*` proves it did not.
 */

vi.mock("next-intl", () => ({
    useTranslations: (namespace?: string) => (key: string) =>
        namespace ? `${namespace}.${key}` : key,
    useLocale: () => "vi",
}))

vi.mock("@heroui/react", () => {
    const Dropdown = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>
    Dropdown.Popover = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>
    Dropdown.Menu = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>
    Dropdown.Section = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>
    Dropdown.Item = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>
    return {
        Dropdown,
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
        Chip: Object.assign(
            ({ children }: { children?: React.ReactNode }) => <span>{children}</span>,
            { Label: ({ children }: { children?: React.ReactNode }) => <span>{children}</span> },
        ),
        Label: ({ children }: { children?: React.ReactNode }) => <span>{children}</span>,
        Skeleton: () => <div />,
        TextField: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
        TextArea: (props: React.ComponentProps<"textarea">) => <textarea {...props} />,
        Typography: ({ children }: { children?: React.ReactNode }) => <span>{children}</span>,
        toast: { danger: vi.fn() },
        cn: (...values: Array<unknown>) => values.filter(Boolean).join(" "),
    }
})

vi.mock("@phosphor-icons/react", () => ({
    ArrowClockwiseIcon: () => <span />,
    CaretUpIcon: () => <span />,
    CheckCircleIcon: () => <span />,
    XIcon: () => <span />,
    DotsThreeIcon: () => <span />,
    PencilSimpleIcon: () => <span />,
    TrashIcon: () => <span />,
    FlagIcon: () => <span />,
}))

vi.mock("@/hooks/useRequireAuth", () => ({
    useRequireAuth: () => ({
        authenticated: true,
        requireAuth: () => true,
        guard: (action: (...args: Array<unknown>) => void) => action,
    }),
}))

vi.mock("@/redux/hooks", () => ({
    useAppSelector: (selector: (state: { user: { user: null } }) => unknown) =>
        selector({ user: { user: null } }),
}))

vi.mock("@/components/features/identity", () => ({
    UserLink: ({ displayName }: { displayName?: string }) => <span>{displayName}</span>,
}))

vi.mock("@/components/reuseable/MarkdownContent", () => ({
    MarkdownContent: ({ markdown }: { markdown: string }) => <p>{markdown}</p>,
}))

vi.mock("@/components/reuseable/RichCommentEditor", () => ({
    RichCommentEditor: () => <div data-testid="composer" />,
}))

vi.mock("@/components/reuseable/RichTextEditor", () => ({
    RichTextEditor: () => <div />,
}))

vi.mock("@/components/reuseable/PostEngagementBar/ReportDialog", () => ({
    ReportDialog: () => null,
}))

vi.mock("@/components/reuseable/PostEngagementBar/ConfirmDialog", () => ({
    ConfirmDialog: () => null,
}))

vi.mock(
    "@/components/features/community/CommunityPostDetail/hooks/useMutateReportContentSwr",
    () => ({ useMutateReportContentSwr: () => vi.fn() }),
)

// Only the rejection shape matters here — `classifyCommentLoadError` duck-types `status`.
vi.mock("@/modules/api/rest/client", () => ({
    RestError: class RestError extends Error {
        status: number

        constructor(message: string, status: number) {
            super(message)
            this.status = status
        }
    },
}))

/** The comment page the thread reads; each test sets it before rendering. */
const commentsSwr = vi.hoisted(() => ({
    current: {
        data: undefined as unknown,
        error: undefined as unknown,
        isValidating: false,
        mutate: vi.fn(),
    },
}))

vi.mock("@/components/features/challenge/hooks/useQueryChallengeCommentsSwr", () => ({
    useQueryChallengeCommentsSwr: () => commentsSwr.current,
}))

vi.mock("@/components/features/challenge/hooks/useMutateCreateChallengeCommentSwr", () => ({
    useMutateCreateChallengeCommentSwr: () => ({ submit: vi.fn() }),
}))

vi.mock("@/components/features/challenge/hooks/useMutateDeleteChallengeCommentSwr", () => ({
    useMutateDeleteChallengeCommentSwr: () => ({ remove: vi.fn() }),
}))

import { ChallengePaperCommentThread } from "./ChallengePaperCommentThread"

const renderThread = () =>
    render(<ChallengePaperCommentThread challengeId="11111111-2222-3333-4444-555555555555" />)

beforeEach(() => {
    commentsSwr.current = {
        data: undefined,
        error: undefined,
        isValidating: false,
        mutate: vi.fn(),
    }
})

describe("ChallengePaperCommentThread — surface copy", () => {
    it("says the comments could not be LOADED on a 404, never that the paper was removed", () => {
        commentsSwr.current.error = { status: 404 }
        renderThread()

        expect(
            screen.getByText("challenge.paper.comments.loadFailedUnavailable"),
        ).toBeTruthy()
        // The post copy asserting a deletion must not appear on a challenge at all.
        expect(
            screen.queryByText("communityHub.engagement.commentsLoadFailedNotFound"),
        ).toBeNull()
        expect(
            screen.queryByText("challenge.paper.comments.loadFailedGone"),
        ).toBeNull()
    })

    it("offers a retry on that 404 — an undeployed endpoint starts answering once it ships", () => {
        commentsSwr.current.error = { status: 404 }
        renderThread()

        expect(screen.getByText("communityHub.engagement.retry")).toBeTruthy()
    })

    it("keeps the definite wording for a 410, in PAPER words, and offers no retry", () => {
        commentsSwr.current.error = { status: 410 }
        renderThread()

        expect(screen.getByText("challenge.paper.comments.loadFailedGone")).toBeTruthy()
        expect(
            screen.queryByText("communityHub.engagement.commentsLoadFailedNotFound"),
        ).toBeNull()
        expect(screen.queryByText("communityHub.engagement.retry")).toBeNull()
    })

    it("names the paper, not a post, when the viewer may not read the thread", () => {
        commentsSwr.current.error = { status: 403 }
        renderThread()

        expect(
            screen.getByText("challenge.paper.comments.loadFailedForbidden"),
        ).toBeTruthy()
        expect(
            screen.queryByText("communityHub.engagement.commentsLoadFailedForbidden"),
        ).toBeNull()
    })

    it("uses the paper's own empty line when the thread loads with no comments", () => {
        commentsSwr.current.data = { items: [], page: 1, size: 20, total: 0 }
        renderThread()

        expect(screen.getByText("challenge.paper.comments.empty")).toBeTruthy()
        expect(screen.queryByText("communityHub.engagement.commentsEmpty")).toBeNull()
    })
})

/**
 * Tên tác giả của hàng comment. Adapter này từng chỉ đọc `displayName`, nên mọi tài
 * khoản chưa đặt tên hiển thị — phần lớn hồ sơ import — hiện nhãn chung "Thành viên"
 * dù DTO có `username` hẳn hoi. Mọi mapper comment khác trong repo đều rơi về username;
 * test này ghim lại cho khỏi trượt về cũ.
 */
describe("ChallengePaperCommentThread — tên tác giả", () => {
    it("rơi về username khi author card không có displayName", () => {
        commentsSwr.current.data = {
            items: [
                {
                    id: "cm-1",
                    authorId: "11111111-2222-3333-4444-555555555555",
                    author: {
                        userId: "11111111-2222-3333-4444-555555555555",
                        username: "lan.nguyen",
                        displayName: null,
                    },
                    parentId: null,
                    content: "Đề này chấm theo rubric nào ạ?",
                    status: "VISIBLE",
                    createdAt: new Date().toISOString(),
                    replies: [],
                },
            ],
            page: 1,
            size: 20,
            total: 1,
        }
        renderThread()

        expect(screen.getAllByText("lan.nguyen").length).toBeGreaterThan(0)
        expect(screen.queryByText("common.unknownMember")).toBeNull()
    })
})
