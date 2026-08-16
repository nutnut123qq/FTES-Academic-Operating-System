import React from "react"
import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { ACHIEVEMENTS, PRESS_ARTICLES } from "../content"

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

const pressLinks = PRESS_ARTICLES

describe("AchievementsSection", () => {
    it("renders every configured press article as an external link", () => {
        const { container } = render(<AchievementsSection />)

        const hrefs = Array.from(container.querySelectorAll("a")).map((a) => a.getAttribute("href"))
        expect(pressLinks.length).toBeGreaterThan(0)
        for (const article of pressLinks) {
            expect(hrefs).toContain(article.url)
        }
    })

    it("opens press articles in a new tab without leaking the referrer", () => {
        const { container } = render(<AchievementsSection />)

        for (const article of pressLinks) {
            const anchor = container.querySelector(`a[href="${article.url}"]`)
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
    it("moi bai bao dung thanh MOT o rieng, du chin o", () => {
        const { container } = render(<AchievementsSection />)

        const cards = Array.from(container.querySelectorAll("ul li a"))
            .filter((a) => PRESS_ARTICLES.some((p) => p.url === a.getAttribute("href")))
        expect(cards).toHaveLength(PRESS_ARTICLES.length)
        // moi o mang ten toa soan + tieu de, khong phai mot dong link tron
        for (const article of PRESS_ARTICLES) {
            const card = container.querySelector(`a[href="${article.url}"]`)
            expect(card?.textContent).toContain(article.source)
            expect(card?.textContent).toContain(article.title)
        }
    })

    it("khoi bao chi co tieu de rieng, khong con nam trong the thanh tuu", () => {
        render(<AchievementsSection />)

        expect(screen.getAllByText("achievements.press").length).toBe(1)
    })
})
