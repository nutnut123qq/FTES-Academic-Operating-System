import React from "react"
import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import type { PublicProfile } from "../../hooks/useQueryPublicProfileSwr"

/**
 * Hàng chỉ số của hồ sơ công khai. Test này TỪNG sống trong `ProfileOverviewTab` — hàng chỉ
 * số đã dời vào ô thông tin (dưới phần giới thiệu) nên test đi theo component, chứ không
 * phải bị xoá cho suite xanh.
 *
 * Hai điều được ghim:
 *  - bốn con số render TRẦN (icon + số), không bọc `MetricCard` — chủ dự án chốt bỏ khung ô;
 *  - số dự án / thành tựu lấy từ ĐỘ DÀI MẢNG, nên là số chính xác chứ không phải số của một
 *    trang.
 *
 * `t` trả lại chính khoá dịch, nên assertion bám khoá thay vì bám câu tiếng Việt.
 */

vi.mock("next-intl", () => ({
    useTranslations: () => (key: string) => key,
}))

vi.mock("@phosphor-icons/react", () => {
    const Icon = () => <span />
    return { MedalIcon: Icon, StackIcon: Icon, UserPlusIcon: Icon, UsersThreeIcon: Icon }
})

vi.mock("@heroui/react", () => ({
    Typography: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}))

import { ProfileStatsRow } from "./index"

const PROFILE = {
    followers: 128,
    following: 34,
    projects: [{ id: "p1" }, { id: "p2" }],
    achievements: [{ id: "a1" }],
} as unknown as PublicProfile

describe("ProfileStatsRow", () => {
    it("hiện bốn con số TRẦN, không bọc khung ô", () => {
        render(<ProfileStatsRow profile={PROFILE} />)

        expect(screen.getByText("128")).toBeTruthy() // người theo dõi
        expect(screen.getByText("34")).toBeTruthy() // đang theo dõi
        expect(screen.getByText("2")).toBeTruthy() // dự án — độ dài mảng, không phải số trang
        expect(screen.getByText("1")).toBeTruthy() // thành tựu
        expect(screen.queryByTestId("metric-card")).toBeNull()
    })

    it("mỗi chỉ số vẫn có nhãn đầy đủ cho trình đọc màn hình", () => {
        render(<ProfileStatsRow profile={PROFILE} />)

        // nhãn nằm trong .sr-only: nhìn thì chỉ thấy số, nhưng không mất tên chỉ số
        expect(screen.getByText("profile.community.connections.followers")).toBeTruthy()
        expect(screen.getByText("publicProfile.stats.achievements")).toBeTruthy()
    })
})
