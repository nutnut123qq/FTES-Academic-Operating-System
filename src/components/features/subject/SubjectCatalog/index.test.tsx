import React from "react"
import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

/**
 * Unit — CHUỖI BỘ LỌC NGÀNH hai cấp của workplace (Khối ngành → Chuyên ngành → Kỳ).
 *
 * Chỗ dễ sai nhất của tính năng này: hồ sơ chỉ lưu MỘT mã (`majorCode`) và mã đó thường là mã
 * CHUYÊN NGÀNH con ("SE"), trong khi giao diện có hai ô. Suy ngược sai một nhịp là workplace tự
 * nhảy vào ngành đã lưu nhưng ô cấp 1 lại đứng ở "Tất cả ngành" — người dùng thấy bộ lọc nói một
 * đằng, lưới môn nói một nẻo, và không có gì báo đỏ. Nên bốn ca dưới đây khoá đúng cặp nhãn hai ô,
 * danh sách cấp 2, và mã THẬT SỰ gửi xuống BE.
 *
 * Mọi thứ quanh bộ lọc đều được thay bằng bản giả (dữ liệu SWR, các block lưới/skeleton) — bài này
 * chỉ nói về bộ lọc. HeroUI được thay bằng nút phẳng để đọc được nội dung menu mà không phải mở
 * popover thật.
 */

/** Bộ lọc lần gần nhất mà catalog gửi xuống `useQuerySubjectsSwr`. */
let lastFilters: { major?: string | null } = {}
/** Mã ngành trên HỒ SƠ của người đang đăng nhập. */
let myMajor: string | null = null

const MAJORS = [
    { code: "IT", name: "Information Technology", description: null, parentCode: null },
    { code: "SE", name: "Software Engineering", description: null, parentCode: "IT" },
    { code: "DM", name: "Digital Marketing", description: null, parentCode: "IT" },
    { code: "BUS", name: "Business", description: null, parentCode: null },
]

vi.mock("next-intl", () => ({
    // Nhãn có tham số phải đọc ra được tham số (ví dụ "Tất cả <khối>"), nếu không thì ca 4 không
    // phân biệt nổi "Tất cả IT" với "Tất cả Business".
    useTranslations: () => (key: string, params?: Record<string, unknown>) =>
        params ? `${key}(${Object.values(params).join(",")})` : key,
    useLocale: () => "vi",
}))
vi.mock("@/i18n/navigation", () => ({
    Link: ({ children }: { children?: React.ReactNode }) => <a>{children}</a>,
}))
vi.mock("@/components/features/mascot-moments", () => ({ MascotMajorPicker: () => null }))
vi.mock("@/components/reuseable/SearchInput", () => ({ SearchInput: () => <input /> }))
vi.mock("@/components/blocks/async/AsyncContent", () => ({
    AsyncContent: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
}))
vi.mock("@/components/blocks/async/InfiniteScrollSentinel", () => ({
    InfiniteScrollSentinel: () => null,
}))
vi.mock("@/components/blocks/skeleton/Skeleton", () => ({ Skeleton: () => null }))
vi.mock("../SubjectCover", () => ({ SubjectCover: () => null }))
vi.mock("@/components/features/profile/hooks/useMyMajor", () => ({
    useMyMajor: () => ({ majorCode: myMajor }),
}))
vi.mock("../hooks/useQueryMajorsSwr", () => ({ useQueryMajorsSwr: () => ({ majors: MAJORS }) }))
vi.mock("../hooks/useQuerySubjectsSwr", () => ({
    SUBJECT_SEMESTERS: [1, 2, 3],
    useQuerySubjectsSwr: (filters: { major?: string | null }) => {
        lastFilters = filters
        return {
            subjects: [],
            isLoading: false,
            error: null,
            hasMore: false,
            isLoadingMore: false,
            loadMore: () => {},
        }
    },
}))

vi.mock("@heroui/react", () => ({
    Typography: ({ children }: { children?: React.ReactNode }) => <p>{children}</p>,
    Dropdown: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
    DropdownTrigger: ({ children }: { children?: React.ReactNode }) => (
        <button type="button" data-testid="trigger">
            {children}
        </button>
    ),
    DropdownPopover: ({ children }: { children?: React.ReactNode }) => (
        <div data-testid="popover">{children}</div>
    ),
    // `onAction` sống trên MENU còn `id` sống trên ITEM, nên bản giả nối hai đầu lại: mỗi item
    // nhận thêm `onSelect` bắn đúng id của nó, đọc được bằng một cú click.
    DropdownMenu: ({
        children,
        onAction,
    }: {
        children?: React.ReactNode
        onAction?: (key: string) => void
    }) => (
        <div role="menu">
            {React.Children.map(children, (child) =>
                React.isValidElement<{ id?: string }>(child)
                    ? React.cloneElement(child as React.ReactElement<Record<string, unknown>>, {
                        onSelect: () => onAction?.(String(child.props.id)),
                    })
                    : child,
            )}
        </div>
    ),
    DropdownItem: ({
        children,
        onSelect,
    }: {
        children?: React.ReactNode
        onSelect?: () => void
    }) => (
        <button type="button" role="menuitem" onClick={onSelect}>
            {children}
        </button>
    ),
}))

vi.mock("@phosphor-icons/react", () => ({ CaretDownIcon: () => null }))

import { SubjectCatalog } from "./index"

/** Nhãn trên trigger của từng dropdown, theo thứ tự hiển thị. */
const triggerLabels = () => screen.getAllByTestId("trigger").map((node) => node.textContent ?? "")

/** Nội dung các mục trong popover thứ `index`. */
const menuItems = (index: number) =>
    Array.from(
        screen.getAllByTestId("popover")[index].querySelectorAll("[role='menuitem']"),
    ).map((node) => node.textContent ?? "")

describe("SubjectCatalog — bộ lọc ngành hai cấp", () => {
    beforeEach(() => {
        lastFilters = {}
        myMajor = null
    })

    it("hồ sơ lưu mã CHUYÊN NGÀNH con: cả ô khối lẫn ô chuyên ngành hiện đúng cặp", () => {
        myMajor = "SE"
        render(<SubjectCatalog />)

        const labels = triggerLabels()
        // Ô 1 phải suy ngược ra KHỐI cha, ô 2 giữ chính chuyên ngành đã lưu.
        expect(labels[0]).toContain("Information Technology")
        expect(labels[1]).toContain("Software Engineering")
        // Và chỉ MỘT mã đi xuống BE — mã con, không phải mã khối.
        expect(lastFilters.major).toBe("SE")
    })

    it("ô cấp 2 chỉ liệt kê con của khối đang chọn, kèm mục 'tất cả khối đó'", () => {
        myMajor = "SE"
        render(<SubjectCatalog />)

        expect(menuItems(1)).toEqual([
            "catalog.allInMajor(Information Technology)",
            "Software Engineering",
            "Digital Marketing",
        ])
        // Ngành của khối khác KHÔNG được lọt vào danh sách trộn.
        expect(menuItems(1).join(" ")).not.toContain("Business")
    })

    it("đổi khối thì chuyên ngành cũ bị bỏ, không giữ cặp lệch nhau", () => {
        myMajor = "SE"
        render(<SubjectCatalog />)

        // Mục cuối của ô cấp 1 là khối "Business" (không có chuyên ngành con).
        const categories = screen.getAllByTestId("popover")[0].querySelectorAll("[role='menuitem']")
        fireEvent.click(categories[categories.length - 1])

        expect(triggerLabels()[0]).toContain("Business")
        // Khối không có con ⇒ ô cấp 2 ẩn hẳn (chỉ còn khối + kỳ), và BE nhận mã KHỐI.
        expect(triggerLabels()).toHaveLength(2)
        expect(lastFilters.major).toBe("BUS")
    })

    it("hồ sơ lưu mã KHỐI: ô cấp 2 đứng ở 'tất cả khối đó', không giả vờ đã chọn con", () => {
        myMajor = "IT"
        render(<SubjectCatalog />)

        expect(triggerLabels()[0]).toContain("Information Technology")
        expect(triggerLabels()[1]).toContain("catalog.allInMajor(Information Technology)")
        expect(lastFilters.major).toBe("IT")
    })
})
