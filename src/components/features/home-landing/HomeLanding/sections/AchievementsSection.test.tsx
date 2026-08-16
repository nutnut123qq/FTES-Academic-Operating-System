import { existsSync } from "node:fs"
import { join } from "node:path"
import React from "react"
import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { ACHIEVEMENTS } from "../content"

/**
 * Component — {@link AchievementsSection}, the home "Thành tựu" carousel.
 *
 * What is worth locking down here is the EVIDENCE footer, not the carousel chrome: a
 * milestone card renders its press coverage even when it has no FTES post of its own
 * (the Gia Lai card has `press` but no `href`, and used to render no footer at all),
 * every article link leaves the tab safely (`target="_blank"` + `rel` carrying both
 * `noopener` and `noreferrer`), and no article configured in `content.ts` is dropped.
 */

vi.mock("next-intl", () => ({
    useTranslations: () => (key: string) => key,
}))

vi.mock("@phosphor-icons/react", () => ({
    ArrowRightIcon: () => <span />,
    CaretLeftIcon: () => <span />,
    CaretRightIcon: () => <span />,
}))

vi.mock("@heroui/react", () => {
    const Chip = ({ children }: { children: React.ReactNode }) => <span>{children}</span>
    Chip.Label = ({ children }: { children: React.ReactNode }) => <span>{children}</span>
    return {
        Chip,
        Link: ({ children, ...props }: React.ComponentProps<"a">) => <a {...props}>{children}</a>,
        Typography: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
    }
})

vi.mock("@/components/blocks/cards/MediaCard", () => ({
    MediaCard: ({ title, footer }: { title: React.ReactNode; footer: React.ReactNode }) => (
        <div>
            {title}
            {footer}
        </div>
    ),
}))

vi.mock("@/components/blocks/carousel/useCarousel", () => ({
    useCarousel: () => ({
        trackRef: { current: null },
        next: vi.fn(),
        prev: vi.fn(),
        pauseHandlers: {},
    }),
}))

import { AchievementsSection } from "./AchievementsSection"

/** Các thẻ BÁO CHÍ trong chính carousel thành tựu (không phải một section riêng). */
const pressCards = ACHIEVEMENTS.filter((item) => item.press)

describe("AchievementsSection", () => {
    it("renders every configured press article as an external link", () => {
        const { container } = render(<AchievementsSection />)

        const hrefs = Array.from(container.querySelectorAll("a")).map((a) => a.getAttribute("href"))
        expect(pressCards.length).toBeGreaterThan(0)
        for (const article of pressCards) {
            expect(hrefs).toContain(article.href)
        }
    })

    it("opens press articles in a new tab without leaking the referrer", () => {
        const { container } = render(<AchievementsSection />)

        for (const article of pressCards) {
            const anchor = container.querySelector(`a[href="${article.href}"]`)
            expect(anchor?.getAttribute("target")).toBe("_blank")
            expect(anchor?.getAttribute("rel")).toContain("noopener")
            expect(anchor?.getAttribute("rel")).toContain("noreferrer")
        }
    })

    /**
     * Chu du an chot: MOT O MOT BAI, khong nhet ca danh sach vao trong the thanh tuu. Ban
     * dau chin bai nam long trong hai the duoi dang danh sach link — test nay ghim lai hinh
     * dang moi de khong ai gop chung tro lai.
     */
    /**
     * Chủ dự án chốt: bài báo là THẺ TRONG carousel thành tựu sẵn có, mỗi bài một thẻ —
     * không phải một section thứ hai, cũng không phải danh sách link nhét trong thẻ khác.
     */
    it("mỗi bài báo là MỘT thẻ trong carousel, đủ chín thẻ", () => {
        expect(pressCards).toHaveLength(9)

        const { container } = render(<AchievementsSection />)
        for (const card of pressCards) {
            const anchor = container.querySelector(`a[href="${card.href}"]`)
            expect(anchor).toBeTruthy()
        }
    })

    /**
     * Thẻ báo chí KHÔNG có khoá i18n (`press1..9` không nằm trong messages). Nếu ai đó nối
     * lại tiêu đề qua `t()` thì màn hình in ra đường khoá thô — test này bắt đúng ca đó.
     */
    it("thẻ báo chí hiện tiêu đề bài và tên toà soạn, không phải khoá i18n", () => {
        render(<AchievementsSection />)

        for (const card of pressCards) {
            expect(screen.getAllByText(card.press!.title).length).toBeGreaterThan(0)
        }
        expect(screen.queryByText(/achievements\.items\.press/)).toBeNull()
    })

    /**
     * Ảnh thẻ báo chí: ưu tiên ảnh CỦA CHÍNH BÀI BÁO (`/press/`). Bốn bài mà trang báo nạp
     * ảnh bằng JS (Báo Gia Lai) hoặc chỉ trả logo (Báo Mới) tạm mượn ảnh FTES chụp tại chính
     * sự kiện đó — đánh dấu trong `content.ts` để thay khi có ảnh thật.
     *
     * Test ghim: mọi ảnh phải là file tự host. Trỏ thẳng vào CDN của toà soạn là để trang chủ
     * phụ thuộc một host ngoài — họ đổi đường dẫn là thẻ mất ảnh, và không có gì báo.
     */
    it("mọi thẻ báo chí dùng ảnh tự host, không hotlink CDN toà soạn", () => {
        for (const card of pressCards) {
            expect(card.imageSrc.startsWith("/")).toBe(true)
            expect(card.imageSrc).not.toMatch(/^https?:/)
        }
    })

    /**
     * Chủ dự án chốt: thẻ báo chí dùng ẢNH CỦA FTES chụp tại chính sự kiện bài báo nói tới,
     * KHÔNG lấy ảnh trong bài — ảnh đó là tác phẩm có bản quyền của toà soạn.
     *
     * Ghim luôn rằng FILE PHẢI TỒN TẠI. Bản trước trỏ 5 thẻ vào `/press/…` trong khi chỉ 2
     * file được tải về: 3 thẻ vỡ ảnh mà tsc lẫn test đều xanh, vì đường dẫn ảnh chỉ là chuỗi.
     * Test cũ ở đây còn khẳng định "đúng 5 thẻ dùng /press/", tức là ghim chặt hành vi sai.
     */
    it("mọi thẻ dùng ảnh FTES, và file ảnh có thật trong public/", () => {
        for (const card of ACHIEVEMENTS) {
            expect(card.imageSrc.startsWith("/achievements/")).toBe(true)
            expect(existsSync(join(process.cwd(), "public", card.imageSrc))).toBe(true)
        }
    })
})
