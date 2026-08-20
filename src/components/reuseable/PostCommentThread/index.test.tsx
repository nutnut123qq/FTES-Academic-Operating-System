import React from "react"
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react"
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
 *  - "Trả lời" nay có ở MỌI cấp và mở một ô soạn RIÊNG ngay dưới hàng vừa bấm
 *    (ô đáy chỉ còn dùng cho bình luận mới, chip "Đang trả lời X" đã bỏ); mỗi
 *    lúc chỉ một ô mở, ✕ / Esc đóng sạch, và trả lời một comment CON vẫn gắn vào
 *    comment cấp 1 của nhánh (cây phẳng 2 cấp) với "@Tên " CHÈN SẴN vào ô soạn
 *    (prop `prefill` của RichCommentEditor) — không ghép lúc gửi, nên tag hiện ra
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
    // the row formats its like counter with the active locale
    useLocale: () => "vi",
}))

/** Toast spy shared with the `@heroui/react` factory (the like failure path toasts). */
const toastDanger = vi.hoisted(() => vi.fn())

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
        // `aria-label`/`aria-pressed` are forwarded because the like button is
        // icon-only: its accessible name IS the label, and the pressed state is the
        // only way a test (or a screen reader) can tell liked from not-liked.
        Button: ({
            children,
            onPress,
            isDisabled,
            "aria-label": ariaLabel,
            "aria-pressed": ariaPressed,
        }: {
            children?: React.ReactNode
            onPress?: () => void
            isDisabled?: boolean
            isPending?: boolean
            "aria-label"?: string
            "aria-pressed"?: boolean
        }) => (
            <button
                type="button"
                disabled={isDisabled}
                aria-label={ariaLabel}
                aria-pressed={ariaPressed}
                onClick={onPress}
            >
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
        toast: { danger: toastDanger },
    }
})

vi.mock("@phosphor-icons/react", () => ({
    ArrowClockwiseIcon: () => <span />,
    CaretUpIcon: () => <span />,
    CheckCircleIcon: () => <span />,
    HeartIcon: () => <span />,
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
// vào Tiptap khi `focusTrigger` đổi và ô đang rỗng), còn bấm nút = gửi nguyên văn những gì
// đang có trong ô + phần người dùng gõ. Nhờ vậy test bắt được cả hai lỗi: tag không hiện
// trong ô, và tag bị ghép HAI lần (một lần ở ô, một lần lúc gửi).
//
// `data-testid` là chính placeholder vì thread nay render HAI ô soạn cùng lúc — ô đáy
// (bình luận mới) và ô trả lời inline — nên test phải chỉ đích danh ô nào.
vi.mock("@/components/reuseable/RichCommentEditor", () => ({
    RichCommentEditor: ({
        placeholder,
        prefill,
        onSubmit,
    }: {
        placeholder?: string
        prefill?: string
        onSubmit?: (body: string) => boolean | Promise<boolean>
    }) => (
        <div data-testid={placeholder}>
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
        requireAuthAsync: async () => session.authenticated,
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
    session.authenticated = true
    toastDanger.mockClear()
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
/** Ô soạn ĐÁY — nơi viết bình luận cấp 1; luôn có mặt. */
const bottomComposer = () => screen.getByTestId("engagement.commentPlaceholder")

/** Ô soạn TRẢ LỜI inline; `null` khi không có ô nào đang mở. */
const inlineComposer = () => screen.queryByTestId("engagement.replyPlaceholder")

/** `true` khi `node` đứng SAU `reference` trong thứ tự tài liệu. */
const isAfter = (reference: Element, node: Element) =>
    Boolean(reference.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_FOLLOWING)

describe("PostCommentThread — trả lời ở mọi cấp", () => {
    it("hiện nút trả lời trên cả comment con", () => {
        renderThread()

        // 2 comment cấp 1 + 1 comment con
        expect(screen.getAllByText("engagement.reply")).toHaveLength(3)
    })

    it("mở ô soạn NGAY DƯỚI đúng comment được trả lời, không phải ở đáy", () => {
        renderThread()

        // chưa bấm gì thì chỉ có ô đáy
        expect(inlineComposer()).toBeNull()

        // thứ tự DOM: c-1 (Minh) → r-1 (Lan, con của c-1) → c-2
        fireEvent.click(screen.getAllByText("engagement.reply")[1])

        const composer = inlineComposer()
        expect(composer).not.toBeNull()
        // đứng SAU thân comment r-1 và TRƯỚC comment kế tiếp → nằm đúng dưới r-1
        expect(isAfter(screen.getByText("Chuẩn luôn."), composer!)).toBe(true)
        expect(isAfter(composer!, screen.getByText("Mình thử rồi, nhanh hơn hẳn."))).toBe(true)
        // và nó nằm TRÊN ô soạn đáy (ô đáy vẫn là mép cuối vùng bình luận)
        expect(isAfter(composer!, bottomComposer())).toBe(true)
    })

    it("bấm trả lời ở comment khác thì ô cũ ĐÓNG, chỉ một ô mở mỗi lúc", () => {
        renderThread()

        fireEvent.click(screen.getAllByText("engagement.reply")[1])
        expect(screen.getAllByTestId("engagement.replyPlaceholder")).toHaveLength(1)
        expect(isAfter(screen.getByText("Chuẩn luôn."), inlineComposer()!)).toBe(true)

        fireEvent.click(screen.getAllByText("engagement.reply")[2])
        expect(screen.getAllByTestId("engagement.replyPlaceholder")).toHaveLength(1)
        // ô mới nằm dưới c-2, tức SAU thân của c-2
        expect(isAfter(screen.getByText("Mình thử rồi, nhanh hơn hẳn."), inlineComposer()!)).toBe(
            true,
        )
    })

    it("huỷ bằng nút ✕ đóng ô inline và trả về trạng thái sạch", () => {
        renderThread()

        fireEvent.click(screen.getAllByText("engagement.reply")[1])
        fireEvent.click(screen.getByLabelText("engagement.cancelReply"))

        expect(inlineComposer()).toBeNull()
        expect(screen.queryByLabelText("engagement.cancelReply")).toBeNull()
    })

    it("Esc trong ô inline cũng đóng ô đó", () => {
        renderThread()

        fireEvent.click(screen.getAllByText("engagement.reply")[1])
        fireEvent.keyDown(inlineComposer()!, { key: "Escape" })

        expect(inlineComposer()).toBeNull()
    })

    it("trả lời comment CON: tag hiện SẴN trong ô inline, và chỉ MỘT lần khi gửi", async () => {
        const onSubmit = vi.fn().mockResolvedValue(true)
        renderThread({ onSubmit })

        fireEvent.click(screen.getAllByText("engagement.reply")[1])
        // người dùng NHÌN THẤY "@Lan " trong ô ngay lúc bấm, không phải đợi tới lúc gửi
        const composer = inlineComposer()!
        expect(within(composer).getByTestId("composer-draft").textContent).toBe("@Lan ")

        fireEvent.click(within(composer).getByTestId("composer"))

        await waitFor(() => {
            // đúng một lần tag (không phải "@Lan @Lan …") và gắn vào comment CẤP 1
            expect(onSubmit).toHaveBeenCalledWith("@Lan Rõ rồi.", "c-1")
        })
        // gửi xong ô inline đóng lại
        await waitFor(() => expect(inlineComposer()).toBeNull())
    })

    it("trả lời comment cấp 1 thì KHÔNG tag (hàng mới nằm ngay dưới nó)", async () => {
        const onSubmit = vi.fn().mockResolvedValue(true)
        renderThread({ onSubmit })

        fireEvent.click(screen.getAllByText("engagement.reply")[0])
        const composer = inlineComposer()!
        expect(within(composer).getByTestId("composer-draft").textContent).toBe("")

        fireEvent.click(within(composer).getByTestId("composer"))

        await waitFor(() => {
            expect(onSubmit).toHaveBeenCalledWith("Rõ rồi.", "c-1")
        })
    })

    it("ô soạn ĐÁY vẫn gửi bình luận cấp 1 kể cả khi đang mở ô trả lời", async () => {
        const onSubmit = vi.fn().mockResolvedValue(true)
        renderThread({ onSubmit })

        fireEvent.click(screen.getAllByText("engagement.reply")[1])
        fireEvent.click(within(bottomComposer()).getByTestId("composer"))

        await waitFor(() => {
            // KHÔNG kèm cha → là bình luận mới, không phải trả lời
            // (`toHaveBeenCalledWith` khớp cả số đối số, nên đây vẫn bắt được nếu ô đáy
            // lỡ gửi kèm `parentCommentId`)
            expect(onSubmit).toHaveBeenCalledWith("Rõ rồi.")
        })
    })

    it("KHÔNG còn chip 'Đang trả lời X' ở ô đáy (nhãn giờ thuộc về ô inline)", () => {
        renderThread()

        fireEvent.click(screen.getAllByText("engagement.reply")[1])

        // nhãn chỉ tồn tại dưới dạng tên vùng của ô inline, không in ra chữ lần nữa
        expect(screen.queryByText("engagement.replyingTo#Lan")).toBeNull()
        expect(screen.getByRole("group", { name: "engagement.replyingTo#Lan" })).toBeTruthy()
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

describe("PostCommentThread — tym một bình luận", () => {
    /**
     * Id ở đây phải là UUID THẬT chứ không phải nhãn tuỳ ý như các fixture khác trong file:
     * trái tim CHỈ hiện trên hàng đã có id server, vì hàng lạc quan mang id tạm (`tmp-…` /
     * `optimistic-…`) mà mọi đường ghi tym đều ép uuid. Fixture mang sai hình dạng id thì
     * đang đo một bề mặt production không bao giờ dựng.
     */
    const COMMENT_ID = "aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa"
    const REPLY_ID = "bbbbbbbb-2222-4222-8222-bbbbbbbbbbbb"

    /** Một comment gốc đã có 3 tym (viewer CHƯA thích) + một reply chưa ai thích. */
    const likeable = (): Array<PostComment> => [
        {
            id: COMMENT_ID,
            author: "Minh",
            authorUsername: "minh",
            text: "Dùng index cho cột join là được.",
            timeLabel: "2 giờ",
            likeCount: 3,
            likedByMe: false,
            replies: [
                {
                    id: REPLY_ID,
                    author: "Lan",
                    authorUsername: "lan",
                    text: "Chuẩn luôn.",
                    timeLabel: "1 giờ",
                    likeCount: 0,
                    likedByMe: false,
                },
            ],
        },
    ]

    it("KHÔNG render trái tim khi bề mặt không truyền handler", () => {
        renderThread({ comments: likeable() })
        expect(screen.queryByLabelText("engagement.like")).toBeNull()
    })

    it("đổi trái tim + số đếm NGAY rồi mới ghi (lạc quan), cả trên reply", async () => {
        const onToggleCommentLike = vi.fn().mockResolvedValue(undefined)
        renderThread({ comments: likeable(), onToggleCommentLike })

        // gốc: 3 tym, chưa thích → nhãn "thích"; reply: 0 tym nên không in số
        const hearts = screen.getAllByLabelText("engagement.like")
        expect(hearts).toHaveLength(2)
        expect(screen.getByText("3")).toBeTruthy()

        fireEvent.click(hearts[0])

        // số nhảy lên trước khi promise ghi xong, nhãn đảo sang "bỏ thích"
        await waitFor(() => expect(screen.getByText("4")).toBeTruthy())
        expect(screen.getByLabelText("engagement.unlike").getAttribute("aria-pressed")).toBe("true")
        expect(onToggleCommentLike).toHaveBeenCalledWith(COMMENT_ID, true)

        // bấm lại = bỏ thích, quay đúng về 3
        fireEvent.click(screen.getByLabelText("engagement.unlike"))
        await waitFor(() => expect(screen.getByText("3")).toBeTruthy())
        expect(onToggleCommentLike).toHaveBeenLastCalledWith(COMMENT_ID, false)
    })

    it("KHÔNG render trái tim trên bình luận LẠC QUAN chưa có id server", () => {
        const onToggleCommentLike = vi.fn().mockResolvedValue(undefined)
        renderThread({
            comments: [{ ...likeable()[0], id: "tmp-1755000000000", replies: [] }],
            onToggleCommentLike,
        })

        // `ReactionRequest.targetId` và `@PathVariable UUID commentId` đều ép uuid, nên tym một
        // hàng `tmp-…` chắc chắn 400 → rollback + toast lỗi ngay trên bình luận người dùng vừa
        // gửi. Chưa có id thật thì chưa hiện trái tim.
        expect(screen.queryByLabelText("engagement.like")).toBeNull()
    })

    it("ghi hỏng thì TRẢ LẠI trạng thái cũ và báo lỗi", async () => {
        const onToggleCommentLike = vi.fn().mockRejectedValue(new Error("500"))
        renderThread({ comments: likeable(), onToggleCommentLike })

        fireEvent.click(screen.getAllByLabelText("engagement.like")[0])

        await waitFor(() => expect(toastDanger).toHaveBeenCalledWith("engagement.likeFailed"))
        expect(screen.getByText("3")).toBeTruthy()
        // hai hàng cùng chưa-thích trở lại (gốc + reply) → lấy hàng gốc
        expect(
            screen.getAllByLabelText("engagement.like")[0].getAttribute("aria-pressed"),
        ).toBe("false")
    })

    it("bấm nhanh HAI lần khi request chưa về: chỉ ghi MỘT lần, không đếm hai", async () => {
        let settle: () => void = () => undefined
        const onToggleCommentLike = vi
            .fn()
            .mockReturnValue(new Promise<void>((resolve) => {
                settle = resolve
            }))
        renderThread({ comments: likeable(), onToggleCommentLike })

        const heart = screen.getAllByLabelText("engagement.like")[0]
        fireEvent.click(heart)
        await waitFor(() => expect(screen.getByText("4")).toBeTruthy())
        // lượt bấm thứ hai rơi vào lúc request đầu còn bay → bị bỏ qua
        fireEvent.click(screen.getByLabelText("engagement.unlike"))

        expect(onToggleCommentLike).toHaveBeenCalledTimes(1)
        expect(screen.getByText("4")).toBeTruthy()

        settle()
        await waitFor(() => expect(screen.getByText("4")).toBeTruthy())
    })

    it("khách chưa đăng nhập: mở modal đăng nhập, KHÔNG ghi và KHÔNG đổi số", () => {
        session.authenticated = false
        const onToggleCommentLike = vi.fn().mockResolvedValue(undefined)
        renderThread({ comments: likeable(), onToggleCommentLike })

        fireEvent.click(screen.getAllByLabelText("engagement.like")[0])

        expect(onToggleCommentLike).not.toHaveBeenCalled()
        expect(screen.getByText("3")).toBeTruthy()
    })
})
