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

    it("có TÊN kỳ ⇒ hiện tên, KHÔNG hiện mã thô", () => {
        // Mã kỳ được dựng dạng `T-<mã kỳ>-<8 ký tự băm>` (SeasonTermSyncService) nên nó
        // KHÔNG phải thứ để đọc — người dùng đã nhìn thấy nguyên chuỗi "T-SU26-bfd6f768"
        // trên trang thật. Có tên (V356) thì tên phải thắng.
        render(<SeasonHeader seasonCode="T-SU26-bfd6f768" seasonName="Kỳ Summer 2026" noSeason={false} />)
        expect(screen.getByText("Kỳ Summer 2026")).toBeTruthy()
        expect(screen.queryByText("T-SU26-bfd6f768")).toBeNull()
    })

    it("tên rỗng/toàn khoảng trắng ⇒ rơi về mã, KHÔNG để trống nhãn", () => {
        // Chuỗi rỗng lọt qua `??`; chỉ `||` sau khi trim mới chặn được. Không chặn thì dải
        // mùa giải hiện một dòng tiêu đề TRỐNG.
        render(<SeasonHeader seasonCode="T2026S1" seasonName="   " noSeason={false} />)
        expect(screen.getByText("T2026S1")).toBeTruthy()
    })
})
