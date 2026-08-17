import React from "react"
import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

/**
 * Component — dải "đang là kỳ nào".
 *
 * Ghim đúng ba câu người dùng sẽ đọc, và ranh giới giữa chúng chính là chỗ dự án này đã
 * sai nhiều lần:
 *  - backend trả cờ `NO_SEASON` ⇒ nói "chưa có kỳ nào đang chạy" (KHÔNG phải "bảng trống"),
 *  - chưa biết gì (đang tải / chưa đăng nhập) ⇒ IM LẶNG, vì "chưa có kỳ nào" lúc đó là một
 *    khẳng định mình chưa hỏi được máy chủ,
 *  - có kỳ ⇒ hiện mã kỳ.
 *
 * `t` echo key nên khẳng định được đúng câu nào được chọn.
 */

vi.mock("next-intl", () => ({
    useTranslations: () => (key: string) => key,
}))

import { SeasonHeader } from "./SeasonHeader"

describe("SeasonHeader", () => {
    it("cờ NO_SEASON ⇒ 'chưa có kỳ nào', KHÔNG phải câu bảng rỗng", () => {
        render(<SeasonHeader seasonCode={null} noSeason />)
        expect(screen.getByText("season.none")).toBeTruthy()
        expect(screen.getByText("season.noneHint")).toBeTruthy()
        // Tuyệt đối không được mượn câu của nhánh rỗng.
        expect(screen.queryByText("empty")).toBeNull()
        expect(screen.queryByText("emptyHint")).toBeNull()
    })

    it("chưa biết gì (chưa có mã kỳ, chưa có cờ) ⇒ im lặng, không khẳng định bừa", () => {
        const { container } = render(<SeasonHeader seasonCode={null} noSeason={false} />)
        expect(container.textContent).toBe("")
    })

    it("có kỳ ⇒ hiện MÃ KỲ backend trả, không bịa tên đẹp", () => {
        render(<SeasonHeader seasonCode="T2026S1" noSeason={false} />)
        expect(screen.getByText("T2026S1")).toBeTruthy()
        expect(screen.queryByText("season.none")).toBeNull()
    })
})
