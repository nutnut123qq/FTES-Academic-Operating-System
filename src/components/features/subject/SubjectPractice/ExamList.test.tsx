import React from "react"
import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

/**
 * Component — {@link ExamList}: the FE album list row's META LINE, and the dialog a row
 * opens.
 *
 * Two owner-driven changes are pinned here.
 *
 * **The meta line.** It used to lead with a rating — "0.0 sao (0 đánh giá)" on every row of
 * every subject, because nothing in the app rates an exam. It now reads **who uploaded it ·
 * when**, and the interesting half is the MISSING case: `uploaderName` is optional (the BE
 * field is additive, a profile can be gone), and a test that only covered the happy path
 * would pass while a real row rendered the literal "undefined" or a dangling " · ".
 *
 * **The dialog.** "Mở trang đầy đủ" is gone — the deep-link route still exists, it is just
 * no longer advertised — and the album's own full-screen switch now grows the DIALOG, which
 * is the one part of expanding the album cannot do for itself.
 *
 * `useTranslations` echoes the key, so an assertion can read a message id straight; that is
 * also what makes "no rating anywhere" checkable — a surviving `t("practice.exam.ratingLabel")`
 * would print its own key.
 */

vi.mock("next-intl", () => ({
    useTranslations: () => (key: string) => key,
    useLocale: () => "vi",
}))

const { push } = vi.hoisted(() => ({ push: vi.fn() }))
vi.mock("@/i18n/navigation", () => ({ useRouter: () => ({ push }) }))

// HeroUI primitives → plain elements. `Modal.Dialog` keeps its className on the node so the
// full-screen swap can be asserted on the real strings rather than on a boolean.
vi.mock("@heroui/react", () => {
    const Modal = ({ isOpen, children }: { isOpen: boolean; children: React.ReactNode }) =>
        isOpen ? <div data-testid="modal">{children}</div> : null
    Modal.Backdrop = ({ children }: { children: React.ReactNode }) => <div>{children}</div>
    Modal.Container = ({
        children,
        className,
        size,
    }: {
        children: React.ReactNode
        className?: string
        size?: string
    }) => (
        <div data-testid="modal-container" data-size={size} className={className}>
            {children}
        </div>
    )
    Modal.Dialog = ({
        children,
        className,
    }: {
        children: React.ReactNode
        className?: string
    }) => (
        <div data-testid="modal-dialog" className={className}>
            {children}
        </div>
    )
    Modal.CloseTrigger = () => <button type="button">×</button>
    return {
        Modal,
        cn: (...parts: Array<unknown>) => parts.filter(Boolean).join(" "),
        Button: ({
            children,
            onPress,
        }: {
            children?: React.ReactNode
            onPress?: () => void
        }) => (
            <button type="button" onClick={onPress}>
                {children}
            </button>
        ),
        Chip: ({ children }: { children?: React.ReactNode }) => <span>{children}</span>,
        Link: ({
            children,
            onPress,
            ...rest
        }: {
            children?: React.ReactNode
            onPress?: () => void
            [key: string]: unknown
        }) => (
            <a
                href="#"
                aria-label={rest["aria-label"] as string | undefined}
                onClick={(event) => {
                    event.preventDefault()
                    onPress?.()
                }}
            >
                {children}
            </a>
        ),
        Typography: ({ children }: { children?: React.ReactNode }) => <span>{children}</span>,
    }
})

// Blocks + sibling surfaces: none of them has anything to do with the meta line or the
// dialog's box, and every one of them would drag more of the app into the test.
vi.mock("@/components/blocks/async/AsyncContent", () => ({
    AsyncContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))
vi.mock("@/components/blocks/skeleton/Skeleton", () => ({ Skeleton: () => null }))
vi.mock("./ExamContribute", () => ({ ExamContribute: () => null }))
vi.mock("./ExamModerationQueue", () => ({ ExamModerationQueue: () => null }))

// The album stands in for itself, but keeps the ONE wire this screen depends on: the
// full-screen report. Pressing the stub's button is the reader pressing `ArrowsOut` in the
// viewer's bottom toolbar (that the real viewer draws that button exactly when it is handed
// a handler is pinned in `ExamImageViewer/index.test.tsx`).
vi.mock("@/components/features/subject/SubjectFeAlbum", () => ({
    SubjectFeAlbum: ({
        albumId,
        onExpandedChange,
    }: {
        albumId?: string
        onExpandedChange?: (expanded: boolean) => void
    }) => (
        <div data-testid="album" data-album-id={albumId}>
            {onExpandedChange ? (
                <button type="button" onClick={() => onExpandedChange(true)}>
                    expand
                </button>
            ) : null}
        </div>
    ),
}))

const { useRequireAuth, useQuerySubjectSwr, useQuerySubjectExamsSwr } = vi.hoisted(() => ({
    useRequireAuth: vi.fn(),
    useQuerySubjectSwr: vi.fn(),
    useQuerySubjectExamsSwr: vi.fn(),
}))
vi.mock("@/hooks/useRequireAuth", () => ({ useRequireAuth }))
vi.mock("../hooks/useQuerySubjectSwr", () => ({ useQuerySubjectSwr }))
vi.mock("../hooks/useQuerySubjectExamsSwr", () => ({ useQuerySubjectExamsSwr }))

import { formatRelativeTime } from "@/components/features/community/hooks/relativeTime"
import { ExamList } from "./ExamList"
import type { SubjectExam } from "../hooks/useQuerySubjectExamsSwr"

/** Two hours ago — recent enough that the relative label is unambiguous. */
const TWO_HOURS_AGO = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()

/** One unlocked FE album row. */
const exam = (overrides: Partial<SubjectExam> = {}): SubjectExam => ({
    id: "album-1",
    title: "Đề FE kỳ Xuân",
    uploaderName: "Nguyễn Văn A",
    createdAt: TWO_HOURS_AGO,
    visibility: "PUBLIC",
    lockedForViewer: false,
    ...overrides,
})

const list = (exams: Array<SubjectExam>) => ({
    exams,
    subjectUuid: "subject-uuid",
    isLoading: false,
    isValidating: false,
    error: undefined,
    mutate: vi.fn(),
})

const renderList = () =>
    render(<ExamList subjectId="CSD201" kind="fe" onBack={() => {}} />)

beforeEach(() => {
    vi.clearAllMocks()
    useRequireAuth.mockReturnValue({ guard: (fn: () => void) => fn })
    useQuerySubjectSwr.mockReturnValue({ subject: { courseLinks: [] } })
})

describe("ExamList — dòng meta: người đăng · thời gian", () => {
    it("có tên người đăng → 'tên · bao lâu trước', KHÔNG còn sao/đánh giá", () => {
        useQuerySubjectExamsSwr.mockReturnValue(list([exam()]))

        renderList()

        const when = formatRelativeTime(TWO_HOURS_AGO, "vi")
        expect(when).not.toBe("")
        expect(screen.getByText(`Nguyễn Văn A · ${when}`)).toBeTruthy()
        // The rating key is gone from the catalog; if the call came back it would print
        // its own id here (the translator echoes keys).
        expect(screen.queryByText(/practice\.exam\.ratingLabel/)).toBeNull()
        // …and the bare `toLocaleDateString` the line used to end with is gone too: the
        // album header states the same fact relatively, and one fact gets one wording.
        expect(
            screen.queryByText(new Date(TWO_HOURS_AGO).toLocaleDateString("vi")),
        ).toBeNull()
    })

    it("KHÔNG có tên (BE cũ / hồ sơ đã xoá) → CHỈ thời gian, không 'undefined', không ' · ' thừa", () => {
        useQuerySubjectExamsSwr.mockReturnValue(list([exam({ uploaderName: null })]))

        renderList()

        const when = formatRelativeTime(TWO_HOURS_AGO, "vi")
        const meta = screen.getByText(when)
        expect(meta.textContent).toBe(when)
        expect(meta.textContent).not.toContain("·")
        expect(screen.queryByText(/undefined|null/)).toBeNull()
    })

    it("không tên, không ngày → dòng meta RỖNG hẳn (không còn dấu phân cách mồ côi)", () => {
        useQuerySubjectExamsSwr.mockReturnValue(
            list([exam({ uploaderName: null, createdAt: null })]),
        )

        renderList()

        expect(screen.getByText("Đề FE kỳ Xuân")).toBeTruthy()
        expect(screen.queryByText(/·/)).toBeNull()
    })
})

describe("ExamList — modal đề", () => {
    const openFirstRow = () => {
        renderList()
        fireEvent.click(screen.getByLabelText("Đề FE kỳ Xuân"))
    }

    beforeEach(() => {
        useQuerySubjectExamsSwr.mockReturnValue(list([exam()]))
    })

    it("bấm hàng vẫn mở đề tại chỗ, và KHÔNG còn nút 'Mở trang đầy đủ'", () => {
        openFirstRow()

        expect(screen.getByTestId("album").getAttribute("data-album-id")).toBe("album-1")
        expect(screen.queryByText("practice.exam.openFullPage")).toBeNull()
        // Bỏ nút nghĩa là bỏ luôn cú điều hướng — modal không được lén đổi URL.
        expect(push).not.toHaveBeenCalled()
    })

    it("album ĐƯỢC trao cần gạt toàn màn hình trong modal (trước đây bị giữ lại)", () => {
        openFirstRow()

        expect(screen.getByText("expand")).toBeTruthy()
    })

    /**
     * Hộp NEO của popup đề: gần trọn bề ngang, chiều cao ghim.
     *
     * `max-w-6xl` (72rem) là thứ vừa bị bỏ — chính nó bó popup lại còn khúc giữa màn hình
     * và bỏ trắng hai bên trên màn 1080p trở lên. Ghim lại ở đây vì đó là một QUYẾT ĐỊNH
     * (chủ dự án chốt "cho nó to tràn ra cả 2 bên"), không phải chuyện thẩm mỹ vặt, và vì
     * `h-[92vh]` là cái mà khung ảnh trong album `flex-1` vào — mất nó là ảnh đề rơi lại
     * sàn `60dvh`. Cùng con số với popup đề PE của `SubjectWorkspaceRail`.
     */
    it("hộp neo bỏ trần 6xl, lấy gần trọn bề ngang + chiều cao ghim", () => {
        openFirstRow()

        const dialog = () => screen.getByTestId("modal-dialog")
        expect(dialog().className).not.toContain("max-w-6xl")
        expect(dialog().className).toContain("sm:w-[96vw]")
        expect(dialog().className).toContain("h-[92vh]")
        // ★ Trần mặc định phải bị GỠ TƯỜNG MINH. `Modal.Container` không truyền `size` ⇒
        // HeroUI lấy `defaultVariants.size = "md"` ⇒ dialog mang `modal__dialog--md`, mà
        // `modal.css` bake `.modal__dialog--md { max-width: 28rem }` trong `@layer components`.
        // Bỏ `max-w-6xl` mà không thay bằng `max-w-none` là popup HẸP LẠI còn 448px — làm
        // NGƯỢC đúng cái quyết định ở trên, và chuỗi class là mắt xích duy nhất test JSDOM
        // chạm tới được.
        expect(dialog().className).toContain("max-w-none")
    })

    it("bật toàn màn hình → dialog bỏ hộp neo, lấy trọn khung nhìn", () => {
        openFirstRow()

        const dialog = () => screen.getByTestId("modal-dialog")

        fireEvent.click(screen.getByText("expand"))

        expect(dialog().className).toBe("h-full max-h-full w-full overflow-hidden rounded-none")
        // Container cũng phải nhả máng lề, nếu không dialog "toàn màn hình" vẫn thụt vào.
        const container = screen.getByTestId("modal-container")
        expect(container.getAttribute("data-size")).toBe("full")
        expect(container.className).toBe("sm:w-full")
    })
})
