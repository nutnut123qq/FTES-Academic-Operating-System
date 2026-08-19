import React from "react"
import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

/**
 * Component — MỘT album FE, HAI chỗ dựng: route
 * `/subjects/[subjectId]/practice/fe/[albumId]` và modal mở từ danh sách đề.
 *
 * Route render `<SubjectFeAlbum />` TRỐNG TRƠN, nên id phải tiếp tục rơi về `useParams()`.
 * Không có compile error nào bắt được chuyện này (prop optional, TSX luôn truyền `{}`), mà
 * hỏng thì deep link chết câm: hook nhận `""` → SWR key `null` → không gọi mạng, trang
 * đứng nguyên ở trạng thái tải. Test ghim đúng hai đường:
 *
 * 1. **Route** — id từ params, có nút "quay lại danh sách".
 * 2. **Modal** — id từ PROP dù `useParams()` rỗng (dialog đứng trên trang khác, URL không
 *    đổi), và bỏ nút quay lại vì × của dialog đã là lối ra.
 *
 * `useTranslations` trả về chính KEY nên assert đọc thẳng đường dẫn khoá i18n.
 */

vi.mock("next-intl", () => ({
    useTranslations: () => (key: string) => key,
    useLocale: () => "vi",
}))

const { useParams, push } = vi.hoisted(() => ({ useParams: vi.fn(), push: vi.fn() }))
vi.mock("next/navigation", () => ({ useParams }))
vi.mock("@/i18n/navigation", () => ({
    Link: ({ children, href }: { children?: React.ReactNode; href: string }) => (
        <a href={href}>{children}</a>
    ),
    useRouter: () => ({ push }),
}))

// Khung ảnh + luồng bình luận không liên quan tới việc lấy id — stub cho test nhẹ và ổn định.
// Stub GIỮ đúng một chi tiết: viewer chỉ vẽ nút toàn màn hình khi host trao `onExpandedChange`
// (điều kiện đó được ghim ở `ExamImageViewer/index.test.tsx`), nên "có nút hay không" ở đây
// đọc thẳng ra "album có trao cần gạt cho viewer hay không".
vi.mock("@/components/features/subject/ExamImageViewer", () => ({
    ExamImageViewer: ({
        onExpandedChange,
    }: {
        onExpandedChange?: (expanded: boolean) => void
    }) => (
        <div data-testid="viewer">
            {onExpandedChange ? (
                <button
                    type="button"
                    data-testid="viewer-expand"
                    onClick={() => onExpandedChange(true)}
                >
                    expand
                </button>
            ) : null}
        </div>
    ),
}))
vi.mock("./FeImageCommentThread", () => ({ FeImageCommentThread: () => null }))
vi.mock("./FeAlbumManager", () => ({ FeAlbumManager: () => null }))
vi.mock("@/components/features/identity/UserLink", () => ({ UserLink: () => null }))

const { useQueryFeAlbumSwr, useQueryResourceDetailSwr } = vi.hoisted(() => ({
    useQueryFeAlbumSwr: vi.fn(),
    useQueryResourceDetailSwr: vi.fn(),
}))
vi.mock("@/components/features/resource/hooks/useQueryFeAlbumSwr", () => ({
    useQueryFeAlbumSwr,
}))
vi.mock("@/components/features/resource/hooks/useQueryResourceDetailSwr", () => ({
    useQueryResourceDetailSwr,
}))

import { SubjectFeAlbum } from "./index"

/** Album đã tải xong, đúng một trang ảnh. */
const album = () => ({
    data: {
        total: 1,
        maxImages: 200,
        canManage: false,
        images: [
            {
                id: "img-1",
                imageUrl: "https://storage/p1.jpg",
                caption: null,
                commentCount: 0,
                kind: "IMAGE",
                textContent: null,
                sourceFilename: null,
            },
        ],
    },
    error: undefined,
    isLoading: false,
    mutate: vi.fn(),
})

describe("SubjectFeAlbum — route vs modal", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        useQueryFeAlbumSwr.mockReturnValue(album())
        useQueryResourceDetailSwr.mockReturnValue({
            resource: { title: "Đề FE kỳ Xuân" },
            isLoading: false,
            error: undefined,
            mutate: vi.fn(),
        })
    })

    it("ROUTE: không prop nào → id lấy từ params, có nút quay lại danh sách", () => {
        useParams.mockReturnValue({ subjectId: "CSD201", albumId: "album-1" })

        // đúng như `practice/fe/[albumId]/page.tsx` render
        render(<SubjectFeAlbum />)

        expect(useQueryFeAlbumSwr).toHaveBeenCalledWith("album-1")
        expect(useQueryResourceDetailSwr).toHaveBeenCalledWith("album-1")
        expect(screen.getByText("Đề FE kỳ Xuân")).toBeTruthy()
        expect(screen.getByTestId("viewer")).toBeTruthy()
        expect(screen.getByText("practice.fe.backToList")).toBeTruthy()
    })

    it("MODAL: id từ PROP dù params rỗng; bỏ nút quay lại", () => {
        // dialog đứng trên trang danh sách: route không mang albumId
        useParams.mockReturnValue({})

        render(<SubjectFeAlbum subjectId="CSD201" albumId="album-2" inModal />)

        expect(useQueryFeAlbumSwr).toHaveBeenCalledWith("album-2")
        expect(screen.getByTestId("viewer")).toBeTruthy()
        expect(screen.queryByText("practice.fe.backToList")).toBeNull()
    })

    it("PROP thắng params khi cả hai cùng có", () => {
        useParams.mockReturnValue({ subjectId: "CSD201", albumId: "album-1" })

        render(<SubjectFeAlbum subjectId="PRF192" albumId="album-2" inModal />)

        expect(useQueryFeAlbumSwr).toHaveBeenCalledWith("album-2")
    })
})

/**
 * Toàn màn hình: TRONG modal trước đây bị tắt hẳn (`onExpandedChange={inModal ? undefined : …}`)
 * vì lớp phủ `fixed` của album resolve theo hộp dialog chứ không theo khung nhìn — nên nút biến
 * mất khỏi thanh dưới. Giờ album vẫn giữ state, còn phần nó KHÔNG tự làm được (phóng to chính cái
 * dialog) thì báo ngược lên host. Ghim cả hai vế: nút có mặt ở CẢ hai host, và host được báo.
 */
describe("SubjectFeAlbum — cần gạt toàn màn hình", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        useQueryFeAlbumSwr.mockReturnValue(album())
        useQueryResourceDetailSwr.mockReturnValue({
            resource: { title: "Đề FE kỳ Xuân" },
            isLoading: false,
            error: undefined,
            mutate: vi.fn(),
        })
        useParams.mockReturnValue({})
    })

    it("MODAL: viewer VẪN được trao cần gạt, và host được báo khi bật", () => {
        const onExpandedChange = vi.fn()

        render(
            <SubjectFeAlbum
                subjectId="CSD201"
                albumId="album-2"
                inModal
                onExpandedChange={onExpandedChange}
            />,
        )

        fireEvent.click(screen.getByTestId("viewer-expand"))

        expect(onExpandedChange).toHaveBeenCalledWith(true)
    })

    it("ROUTE: không có host để báo thì nút vẫn còn nguyên (lớp phủ của chính album)", () => {
        useParams.mockReturnValue({ subjectId: "CSD201", albumId: "album-1" })

        render(<SubjectFeAlbum />)

        expect(screen.getByTestId("viewer-expand")).toBeTruthy()
    })
})
