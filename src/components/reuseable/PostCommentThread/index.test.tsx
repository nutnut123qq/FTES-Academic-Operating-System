import React from "react"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { PostComment } from "@/components/features/community/hooks/useQueryPostDetailSwr"

/**
 * Component — {@link PostCommentThread}: the per-comment affordances added on top
 * of the existing list/composer:
 *  - ACCEPT ANSWER shows only for the post author on a QUESTION post, only on
 *    TOP-LEVEL comments, and never on the comment already accepted (that one
 *    wears the badge instead),
 *  - the accept press reports the comment id back to the feature,
 *  - the comment OWNER GATE: "Sửa"/"Xoá" (now entries of the row's shared ⋯
 *    {@link PostActionsMenu}, not inline buttons) render only on rows whose
 *    `authorUsername` matches the signed-in viewer — a guest (no username) gets
 *    none at all,
 *  - REPORT: a signed-in viewer gets "Báo cáo" on OTHER people's comments (and
 *    replies) which opens the shared report dialog and submits
 *    `targetType: "COMMENT"`; the viewer's own comment and guests get none,
 *  - the owner gate ALSO matches on the viewer id, because surfaces without a
 *    profile join (group feed / discussion) map `authorUsername` to the raw
 *    author id — otherwise the viewer's own comment would offer "Báo cáo",
 *  - `canReportComments={false}` (threads outside the community module) drops
 *    the built-in report entry entirely,
 *  - "Trả lời" nay có ở MỌI cấp, và trả lời một comment CON vẫn gắn vào comment
 *    cấp 1 của nhánh (cây phẳng 2 cấp) với "@Tên " CHÈN SẴN vào ô soạn (prop
 *    `prefill` của RichCommentEditor) — không còn ghép lúc gửi, nên tag hiện ra
 *    cho người dùng thấy và chỉ xuất hiện đúng một lần,
 *  - tên tác giả: hàng không mang tên mà là của chính người đang đăng nhập thì
 *    lấy tên trong store, còn hàng của người khác giữ nhãn chung.
 *
 * `t` echoes the key so assertions key off message ids.
 */

vi.mock("next-intl", () => ({
    useTranslations:
        () =>
            (key: string, params?: Record<string, unknown>) =>
                params && "name" in params ? `${key}#${params.name}` : key,
}))

// `Dropdown.Item` becomes a real button so the ⋯ menu's entries are queryable and
// pressable without React Aria's overlay machinery (same shape the shared
// `PostActionsMenu.test.tsx` uses — the row now renders that menu).
vi.mock("@heroui/react", () => {
    const Dropdown = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>
    Dropdown.Popover = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>
    Dropdown.Menu = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>
    Dropdown.Section = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>
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
        Label: ({ children }: { children?: React.ReactNode }) => <span>{children}</span>,
        Skeleton: () => <div />,
        TextField: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
        TextArea: (props: React.ComponentProps<"textarea">) => <textarea {...props} />,
        Typography: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
        cn: (...values: Array<unknown>) => values.filter(Boolean).join(" "),
    }
})

vi.mock("@phosphor-icons/react", () => ({
    ArrowClockwiseIcon: () => <span />,
    CaretUpIcon: () => <span />,
    CheckCircleIcon: () => <span />,
    XIcon: () => <span />,
    // glyphs the shared ⋯ menu pulls in
    DotsThreeIcon: () => <span />,
    PencilSimpleIcon: () => <span />,
    TrashIcon: () => <span />,
    FlagIcon: () => <span />,
}))

vi.mock("@/components/features/identity", () => ({
    UserLink: ({ displayName }: { displayName: string }) => <span>{displayName}</span>,
}))

vi.mock("@/components/reuseable/MarkdownContent", () => ({
    MarkdownContent: ({ markdown }: { markdown: string }) => <p>{markdown}</p>,
}))

// Ô soạn giả lập ĐÚNG hợp đồng thật: `prefill` là chữ nằm sẵn TRONG ô (bản thật chèn nó
// vào Tiptap khi `focusTrigger` đổi và ô đang rỗng), còn bấm "composer" = gửi nguyên văn
// những gì đang có trong ô + phần người dùng gõ. Nhờ vậy test bắt được cả hai lỗi: tag
// không hiện trong ô, và tag bị ghép HAI lần (một lần ở ô, một lần lúc gửi).
vi.mock("@/components/reuseable/RichCommentEditor", () => ({
    RichCommentEditor: ({
        prefill,
        onSubmit,
    }: {
        prefill?: string
        onSubmit?: (body: string) => boolean | Promise<boolean>
    }) => (
        <div>
            <span data-testid="composer-draft">{prefill ?? ""}</span>
            <button
                type="button"
                data-testid="composer"
                onClick={() => void onSubmit?.(`${prefill ?? ""}Rõ rồi.`)}
            >
                composer
            </button>
        </div>
    ),
}))

/** Mutable session flag + the shared report mutation, shared with the factories. */
const session = vi.hoisted(() => ({ authenticated: true }))
const submitReport = vi.hoisted(() => vi.fn())
/** Người đang đăng nhập trong store (mặc định: khách). */
const store = vi.hoisted(() => ({
    user: null as { id: string; username: string; displayName?: string | null } | null,
}))

vi.mock("@/hooks/useRequireAuth", () => ({
    useRequireAuth: () => ({
        authenticated: session.authenticated,
        requireAuth: () => session.authenticated,
        guard: (action: (...args: Array<unknown>) => void) => action,
    }),
}))

vi.mock("@/redux/hooks", () => ({
    // mặc định không có session user → prop `currentUsername` là viewer duy nhất
    useAppSelector: (selector: (state: { user: { user: unknown } }) => unknown) =>
        selector({ user: { user: store.user } }),
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

beforeEach(() => {
    store.user = null
})

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

/**
 * The `labels` escape hatch. The thread's own copy is written for a community POST, so
 * every non-post surface (a challenge's exam paper, an FE album picture) has to be able to
 * replace the lines that NAME the object — while a caller that passes nothing keeps the
 * exact wording it had before this prop existed.
 */
describe("PostCommentThread — per-surface copy", () => {
    it("keeps the shared post copy when the caller supplies no labels", () => {
        renderThread({ comments: [], hasError: true, error: { status: 410 } })

        expect(screen.getByText("engagement.commentsLoadFailedNotFound")).toBeTruthy()
    })

    it("uses the surface's own line for the state it overrode", () => {
        renderThread({
            comments: [],
            hasError: true,
            error: { status: 410 },
            labels: { loadFailedGone: "Đề này không còn nữa." },
        })

        expect(screen.getByText("Đề này không còn nữa.")).toBeTruthy()
        expect(screen.queryByText("engagement.commentsLoadFailedNotFound")).toBeNull()
    })

    it("falls back per-state, so a partial label set only replaces what it names", () => {
        // `loadFailedGone` is overridden, `loadFailedServer` is not → the 500 keeps the
        // shared line rather than borrowing the surface's unrelated one.
        renderThread({
            comments: [],
            hasError: true,
            error: { status: 500 },
            labels: { loadFailedGone: "Đề này không còn nữa." },
        })

        expect(screen.getByText("engagement.commentsLoadFailedServer")).toBeTruthy()
    })

    it("overrides the empty state too", () => {
        renderThread({ comments: [], labels: { empty: "Chưa có bình luận nào cho đề này." } })

        expect(screen.getByText("Chưa có bình luận nào cho đề này.")).toBeTruthy()
        expect(screen.queryByText("engagement.commentsEmpty")).toBeNull()
    })
})

/**
 * "Trả lời" ở mọi cấp + auto-tag. Trước đây chỉ comment cấp 1 có nút, nên một câu trả
 * lời nhắm vào comment con không có đường nào để viết. Nay mọi hàng đều có nút, nhưng
 * cây KHÔNG sâu thêm: hàng mới gắn vào comment cấp 1 của nhánh — bù lại nội dung được
 * ghép sẵn "@Tên " để không mất địa chỉ (đúng cách Facebook làm).
 */
describe("PostCommentThread — trả lời ở mọi cấp", () => {
    it("hiện nút trả lời trên cả comment con", () => {
        renderThread()

        // 2 comment cấp 1 + 1 comment con
        expect(screen.getAllByText("engagement.reply")).toHaveLength(3)
    })

    it("trả lời comment CON: tag hiện SẴN trong ô soạn, và chỉ MỘT lần khi gửi", async () => {
        const onSubmit = vi.fn().mockResolvedValue(true)
        renderThread({ onSubmit })

        // ô soạn trống trước khi bấm trả lời
        expect(screen.getByTestId("composer-draft").textContent).toBe("")

        // thứ tự DOM: c-1 (Minh) → r-1 (Lan, con của c-1) → c-2
        fireEvent.click(screen.getAllByText("engagement.reply")[1])
        // người dùng NHÌN THẤY "@Lan " trong ô ngay lúc bấm, không phải đợi tới lúc gửi
        expect(screen.getByTestId("composer-draft").textContent).toBe("@Lan ")

        fireEvent.click(screen.getByTestId("composer"))

        await waitFor(() => {
            // đúng một lần tag (không phải "@Lan @Lan …") và gắn vào comment CẤP 1
            expect(onSubmit).toHaveBeenCalledWith("@Lan Rõ rồi.", "c-1")
        })
    })

    it("trả lời comment cấp 1 thì KHÔNG tag (hàng mới nằm ngay dưới nó)", async () => {
        const onSubmit = vi.fn().mockResolvedValue(true)
        renderThread({ onSubmit })

        fireEvent.click(screen.getAllByText("engagement.reply")[0])
        expect(screen.getByTestId("composer-draft").textContent).toBe("")

        fireEvent.click(screen.getByTestId("composer"))

        await waitFor(() => {
            expect(onSubmit).toHaveBeenCalledWith("Rõ rồi.", "c-1")
        })
    })
})

/**
 * Nhãn "Thành viên" chỉ được dùng khi THẬT SỰ không biết người viết là ai. Với comment
 * của chính người đang đăng nhập (node lạc quan vừa gửi, hoặc nguồn không join profile)
 * thì tên đã nằm sẵn trong store — không có cớ gì hiện nhãn chung.
 */
describe("PostCommentThread — tên tác giả", () => {
    /** Một comment của chính viewer, hàng KHÔNG mang tên (chưa có author card). */
    const ownComment = (): Array<PostComment> => [
        {
            id: "opt-1",
            author: "",
            authorUsername: "11111111-2222-3333-4444-555555555555",
            text: "Vừa gửi xong.",
            timeLabel: "vài giây",
        },
    ]

    it("dùng tên người đang đăng nhập cho comment CỦA HỌ khi hàng chưa mang tên", () => {
        store.user = {
            id: "11111111-2222-3333-4444-555555555555",
            username: "khoa",
            displayName: "Khoa Trần",
        }
        renderThread({ comments: ownComment() })

        expect(screen.getAllByText("Khoa Trần").length).toBeGreaterThan(0)
        expect(screen.queryByText("unknownMember")).toBeNull()
    })

    it("rơi về username khi tài khoản chưa đặt tên hiển thị", () => {
        store.user = {
            id: "11111111-2222-3333-4444-555555555555",
            username: "khoa",
            displayName: null,
        }
        renderThread({ comments: ownComment() })

        expect(screen.getAllByText("khoa").length).toBeGreaterThan(0)
        expect(screen.queryByText("unknownMember")).toBeNull()
    })

    it("KHÔNG đoán tên cho comment của người khác — giữ nhãn chung", () => {
        store.user = {
            id: "11111111-2222-3333-4444-555555555555",
            username: "khoa",
            displayName: "Khoa Trần",
        }
        renderThread({
            comments: [
                {
                    id: "c-9",
                    author: "",
                    authorUsername: "99999999-8888-7777-6666-555555555555",
                    text: "Của người khác.",
                    timeLabel: "1 phút",
                },
            ],
        })

        expect(screen.getAllByText("unknownMember").length).toBeGreaterThan(0)
        expect(screen.queryByText("Khoa Trần")).toBeNull()
    })
})
