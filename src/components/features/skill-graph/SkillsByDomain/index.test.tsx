import React from "react"
import { fireEvent, render, screen } from "@testing-library/react"
import { NextIntlClientProvider } from "next-intl"
import { beforeEach, describe, expect, it, vi } from "vitest"
import vi_messages from "@/messages/vi.json"
import type { SkillGraphData, SkillNode } from "../hooks/skillGraphModel"

/**
 * Component — {@link SkillsByDomain} render smoke test.
 *
 * Mục tiêu KHÔNG phải là pin từng pixel mà là bắt đúng lớp lỗi mà `tsc` không thấy: cây
 * JSX có dựng được không (Accordion controlled + tab + các block), và bốn nhánh nội dung
 * quan trọng có ra chữ đúng không:
 *
 *  1. thanh tóm tắt in đủ bốn bucket kèm số đếm thật,
 *  2. nhóm nghề hiện theo đúng thứ tự cố định, nhóm rỗng biến mất,
 *  3. trạng thái MẶC ĐỊNH hôm nay (chưa khoá nào khai báo kỹ năng) có callout giải thích,
 *  4. khi BE đã trả `sources`, thẻ nói đích danh khoá học và dải tóm tắt hiện việc kế tiếp.
 *
 * Dùng catalog `vi.json` THẬT (không echo key) để một key thiếu/ICU sai là đỏ ngay.
 */

const push = vi.fn()
vi.mock("@/i18n/navigation", () => ({
    useRouter: () => ({ push }),
    Link: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}))

// React Flow không chạy được trong happy-dom và tab "Sơ đồ" không phải phạm vi test này.
vi.mock("../SkillGraph", () => ({
    SkillGraphDiagram: () => <div data-testid="diagram" />,
}))

let graphResult: {
    graph?: SkillGraphData
    progressUnavailable: boolean
    error?: unknown
    mutate: () => void
}
vi.mock("../hooks/useQuerySkillGraphSwr", async () => {
    const model = await vi.importActual<typeof import("../hooks/skillGraphModel")>("../hooks/skillGraphModel")
    return { ...model, useQuerySkillGraphSwr: () => graphResult }
})

const { SkillsByDomain } = await import("./index")

/** Nút tối giản — chỉ khai những trường phép thử quan tâm. */
const node = (overrides: Partial<SkillNode> & Pick<SkillNode, "id" | "name">): SkillNode => ({
    domain: "be",
    level: 0,
    status: "locked",
    levelIndex: 0,
    maxLevel: 5,
    eligibleLevel: 0,
    unlocked: false,
    unlockPercent: null,
    sources: [],
    subjectIds: [],
    courseIds: [],
    ...overrides,
})

const renderView = () =>
    render(
        <NextIntlClientProvider locale="vi" messages={vi_messages}>
            <SkillsByDomain />
        </NextIntlClientProvider>,
    )

beforeEach(() => {
    push.mockClear()
    graphResult = { graph: { nodes: [], edges: [] }, progressUnavailable: false, mutate: vi.fn() }
})

describe("SkillsByDomain", () => {
    it("hiện skeleton khi chưa có dữ liệu", () => {
        graphResult = { graph: undefined, progressUnavailable: false, mutate: vi.fn() }
        const { container } = renderView()
        // skeleton soi gương bố cục thật: thanh tóm tắt + ô tìm + 3 header nhóm
        expect(container.querySelectorAll(".skeleton").length).toBeGreaterThan(5)
        expect(screen.queryByText("Chưa có kỹ năng nào")).toBeNull()
    })

    it("danh mục rỗng → trạng thái rỗng của cả trang", () => {
        renderView()
        expect(screen.getByText("Chưa có kỹ năng nào")).toBeTruthy()
    })

    it("hiện lỗi kèm nút thử lại", () => {
        graphResult = { graph: undefined, progressUnavailable: false, error: new Error("boom"), mutate: vi.fn() }
        renderView()
        expect(screen.getByText("Không tải được bản đồ kỹ năng.")).toBeTruthy()
        expect(screen.getByText("Thử lại")).toBeTruthy()
    })

    it("tóm tắt bốn bucket + nhóm nghề theo thứ tự cố định, nhóm rỗng biến mất", () => {
        graphResult = {
            graph: {
                nodes: [
                    node({ id: "s1", name: "Java Core", domain: "be", status: "mastered", level: 100, unlocked: true, levelIndex: 5 }),
                    node({ id: "s2", name: "Spring Boot", domain: "be", status: "learning", level: 40, unlocked: true, levelIndex: 2 }),
                    node({ id: "s3", name: "React", domain: "fe" }),
                    node({ id: "s4", name: "Kafka", domain: "data", unlockPercent: 30 }),
                ],
                edges: [],
            },
            progressUnavailable: false,
            mutate: vi.fn(),
        }
        const { container } = renderView()

        expect(screen.getByText("4 kỹ năng")).toBeTruthy()
        // legend của SegmentBar in "nhãn · số" — số đếm phải là số THẬT, không phải 0
        const legend = Array.from(container.querySelectorAll("p")).map((element) =>
            // SegmentBar nối nhãn và số bằng nbsp — chuẩn hoá về khoảng trắng thường
            (element.textContent ?? "").replace(/\s+/g, " "),
        )
        expect(legend).toContain("Thành thạo · 1")
        expect(legend).toContain("Đang học · 1")
        expect(legend).toContain("Sắp mở · 1")
        expect(legend).toContain("Chưa mở · 1")

        const headings = screen.getAllByRole("button").map((element) => element.textContent ?? "")
        const domainOrder = ["Backend", "Frontend", "Dữ liệu"].filter((name) =>
            headings.some((text) => text.includes(name)),
        )
        expect(domainOrder).toEqual(["Backend", "Frontend", "Dữ liệu"])
        expect(headings.some((text) => text.includes("Mobile"))).toBe(false)
    })

    it("chưa khoá nào khai báo kỹ năng → callout giải thích ở cấp trang + thẻ nói 'chưa gắn'", () => {
        graphResult = {
            graph: { nodes: [node({ id: "s1", name: "React", domain: "fe", status: "learning", level: 20, unlocked: true, levelIndex: 1 })], edges: [] },
            progressUnavailable: false,
            mutate: vi.fn(),
        }
        renderView()
        expect(screen.getByText("Chưa có khoá học nào khai báo kỹ năng")).toBeTruthy()
        expect(screen.getByText("Chưa gắn với khoá học nào")).toBeTruthy()
    })

    it("có sources → thẻ chỉ đích danh khoá học và dải tóm tắt hiện việc kế tiếp", () => {
        graphResult = {
            graph: {
                nodes: [
                    node({
                        id: "s1",
                        name: "Spring Boot",
                        domain: "be",
                        unlockPercent: 60,
                        sources: [
                            {
                                courseId: "c1",
                                courseTitle: "C Basic",
                                courseSlug: "c-basic",
                                completionPercent: 60,
                                requiredPercent: 80,
                                weight: 1,
                            },
                        ],
                    }),
                ],
                edges: [],
            },
            progressUnavailable: false,
            mutate: vi.fn(),
        }
        renderView()

        // dòng mở khoá: nêu ngưỡng, khoá (link), và vị trí hiện tại
        expect(screen.getByText(/Mở khi hoàn thành 80% khoá/)).toBeTruthy()
        const link = screen.getAllByRole("link").find((element) => element.textContent === "C Basic")
        expect(link?.getAttribute("href")).toBe("/courses/c-basic")
        // hành động kế tiếp trên dải tóm tắt: còn 20% nữa
        expect(screen.getByText(/Sắp mở: Spring Boot — còn 20% khoá C Basic/)).toBeTruthy()
        expect(screen.getByText("Học tiếp")).toBeTruthy()
    })

    it("tìm kiếm: bung mọi nhóm có kết quả, ẩn nhóm không khớp, xoá thì trả lại như cũ", () => {
        graphResult = {
            graph: {
                nodes: [
                    node({ id: "s1", name: "Java Core", domain: "be", status: "learning", level: 20, unlocked: true, levelIndex: 1 }),
                    node({ id: "s2", name: "React Query", domain: "fe" }),
                ],
                edges: [],
            },
            progressUnavailable: false,
            mutate: vi.fn(),
        }
        renderView()

        // mặc định: nhóm CÓ việc đang dở (Backend) mở, nhóm toàn khoá (Frontend) đóng
        expect(screen.getByText("Java Core")).toBeTruthy()
        expect(screen.queryByText("React Query")).toBeNull()

        const input = screen.getByPlaceholderText("Tìm kỹ năng…")
        fireEvent.change(input, { target: { value: "react" } })
        // nhóm khớp tự mở, kỹ năng khoá vẫn hiện (không giấu sau "+N"), nhóm kia biến mất
        expect(screen.getByText("React Query")).toBeTruthy()
        expect(screen.queryByText("Java Core")).toBeNull()

        fireEvent.change(input, { target: { value: "" } })
        expect(screen.getByText("Java Core")).toBeTruthy()
        expect(screen.queryByText("React Query")).toBeNull()

        fireEvent.change(input, { target: { value: "khong-co-gi" } })
        expect(screen.getByText("Không có kỹ năng nào khớp với từ khoá.")).toBeTruthy()
    })

    it("nhóm toàn kỹ năng chưa mở: thu gọn sau hàng '+N', bấm mới bung", () => {
        graphResult = {
            graph: {
                nodes: [
                    node({ id: "s1", name: "React", domain: "fe" }),
                    node({ id: "s2", name: "Vue", domain: "fe" }),
                ],
                edges: [],
            },
            progressUnavailable: false,
            mutate: vi.fn(),
        }
        renderView()

        // không nhóm nào có việc dở → mở nhóm đầu tiên, nhưng thẻ khoá bị gom lại
        expect(screen.queryByText("React")).toBeNull()
        fireEvent.click(screen.getByText("+2 kỹ năng chưa mở"))
        expect(screen.getByText("React")).toBeTruthy()
        expect(screen.getByText("Vue")).toBeTruthy()
    })

    it("mất phiên đăng nhập → nói rõ vì sao mọi thẻ đọc thành chưa mở", () => {
        graphResult = {
            graph: { nodes: [node({ id: "s1", name: "React", domain: "fe" })], edges: [] },
            progressUnavailable: true,
            mutate: vi.fn(),
        }
        renderView()
        expect(screen.getByText("Đăng nhập để xem tiến độ của bạn")).toBeTruthy()
    })
})
