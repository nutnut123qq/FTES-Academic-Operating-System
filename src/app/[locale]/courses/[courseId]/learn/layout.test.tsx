import React from "react"
import { cleanup, render } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import LearnLayout from "./layout"

vi.mock("next-intl", () => ({
    useTranslations: () => (key: string) => key,
}))

vi.mock("next/navigation", () => ({
    useSelectedLayoutSegments: () => ["content", "modules", "m0", "contents", "m0-l1"],
}))

vi.mock("@/hooks/zustand/learnSidebar/store", () => ({
    useLearnSidebarStore: () => ({ collapsed: false }),
}))

vi.mock("@/components/features/learn/LearnShell", () => ({
    LearnShell: ({ children, navRail, leftRail, rightRail }: React.PropsWithChildren<{
        navRail?: React.ReactNode
        leftRail?: React.ReactNode
        rightRail?: React.ReactNode
    }>) => (
        <div>
            {navRail}
            {leftRail}
            <main data-testid="lesson-content">{children}</main>
            {rightRail}
        </div>
    ),
}))

vi.mock("@/components/features/learn/ContentMap", () => ({
    ContentMap: () => <aside data-testid="course-content" />,
}))

vi.mock("@/components/features/learn/OnThisPage", () => ({
    OnThisPage: () => <aside data-testid="on-this-page" />,
}))

vi.mock("@/components/features/learn/LearnToolsRail", () => ({
    LearnToolsRail: ({ side = "left" }: { side?: "left" | "right" }) => (
        <aside data-testid="course-menu" data-side={side} />
    ),
}))

vi.mock("@/components/blocks/layout/ResizableRail", () => ({
    ResizableRail: ({ children }: React.PropsWithChildren) => children,
}))

vi.mock("@/components/features/learn/ContentAiFab", () => ({ ContentAiFab: () => null }))
vi.mock("@/components/features/learn/ContentAiChat/ContentAiAnchoredChat", () => ({ ContentAiAnchoredChat: () => null }))
vi.mock("@/components/features/learn/LessonReader/ContentAiSelectionAsk", () => ({ ContentAiSelectionAsk: () => null }))

afterEach(cleanup)

describe("LearnLayout", () => {
    it("places the course menu at the far right on lesson pages", () => {
        const { container } = render(
            <LearnLayout>
                <div />
            </LearnLayout>,
        )

        expect(
            Array.from(container.firstElementChild?.children ?? []).map((element) =>
                element.getAttribute("data-testid"),
            ),
        ).toEqual(["course-content", "lesson-content", "on-this-page", "course-menu"])
        expect(container.querySelector("[data-testid=\"course-menu\"]")?.getAttribute("data-side"))
            .toBe("right")
    })
})
