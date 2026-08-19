import React from "react"
import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

/**
 * Component — {@link MajorPicker}.
 *
 * GHIM: **ô chọn ngành tự khoá thì phải NÓI VÌ SAO.** Danh sách ngành rỗng là trạng thái HỢP LỆ
 * (`useQueryMajorsSwr`: bản BE chưa có `/api/v1/majors` trả 404, hoặc danh mục chưa ai nhập), nên
 * cảnh này gặp thật chứ không phải giả định. Trước bản vá, trigger tự `isDisabled` khi rỗng mà
 * không in một chữ nào: người dùng — thường là người vừa bấm lời mời "Chọn ngành" từ biểu đồ EXP —
 * sang tới đây chỉ thấy một ô xám bấm không được, bên dưới là dòng hint "Ngành quyết định bộ kỹ
 * năng…" như thể mọi thứ bình thường.
 *
 * HeroUI được mock ở mức tối thiểu: bài test này nói về CÂU GIẢI THÍCH và trạng thái khoá, không
 * phải về hành vi dropdown của thư viện.
 */

vi.mock("@heroui/react", () => ({
    Dropdown: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
    DropdownTrigger: ({
        children,
        isDisabled,
    }: {
        children?: React.ReactNode
        isDisabled?: boolean
    }) => (
        <button type="button" disabled={isDisabled}>
            {children}
        </button>
    ),
    DropdownPopover: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
    DropdownMenu: ({ children }: { children?: React.ReactNode }) => <ul>{children}</ul>,
    DropdownItem: ({ children }: { children?: React.ReactNode }) => <li>{children}</li>,
    Typography: ({ children, ...rest }: { children?: React.ReactNode }) => (
        <p {...rest}>{children}</p>
    ),
    cn: (...parts: Array<unknown>) => parts.filter(Boolean).join(" "),
}))

vi.mock("@phosphor-icons/react", () => ({
    CaretDownIcon: () => <span />,
    GraduationCapIcon: () => <span />,
}))

import { MajorPicker } from "./index"

const EMPTY_HINT = "Chưa tải được danh mục ngành nên tạm thời không chọn được."

describe("MajorPicker", () => {
    it("in lý do khi danh mục ngành rỗng — ô xám câm là chỗ người dùng đứng lại", () => {
        render(
            <MajorPicker
                majors={[]}
                value={null}
                onChange={vi.fn()}
                placeholder="Chưa chọn ngành"
                ariaLabel="Ngành"
                emptyHint={EMPTY_HINT}
            />,
        )

        // Không có setup jest-dom trong repo ⇒ kiểm thuộc tính DOM trực tiếp.
        expect((screen.getByRole("button") as HTMLButtonElement).disabled).toBe(true)
        expect(screen.getByText(EMPTY_HINT)).toBeTruthy()
    })

    it("không in lý do khi danh mục có ngành (ô vẫn bấm được)", () => {
        render(
            <MajorPicker
                majors={[
                    { code: "SE", name: "Kỹ thuật phần mềm", description: null, parentCode: "BIT" },
                ]}
                value="SE"
                onChange={vi.fn()}
                placeholder="Chưa chọn ngành"
                ariaLabel="Ngành"
                emptyHint={EMPTY_HINT}
            />,
        )

        expect((screen.getByRole("button") as HTMLButtonElement).disabled).toBe(false)
        expect(screen.queryByText(EMPTY_HINT)).toBeNull()
    })
})
