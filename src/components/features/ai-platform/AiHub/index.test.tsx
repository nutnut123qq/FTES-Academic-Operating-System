import React from "react"
import { fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { AiTool } from "../hooks/useQueryAiToolsSwr"
import type { MyCourse } from "@/components/features/course/hooks/useQueryMyCoursesSwr"

/**
 * Component — {@link AiHub} tile wiring (`ai-hub-live-tools` task 2.3). The data
 * hooks, router, and presentation primitives are mocked so the tests pin the CTA
 * contract of the hub itself:
 *  - every rendered tile has a real action — a tile with neither an `href` nor
 *    the tutor intent (a dead tile) is filtered out entirely,
 *  - an `href` tile's CTA pushes its `/ai/tools/*` route,
 *  - the tutor tile's three branches: exactly 1 enrolled course → straight into
 *    its learn shell; several → the picker modal listing each course; none →
 *    the modal's browse-catalog CTA to `/courses`.
 *
 * `t` echoes the key, so tiles are found via `tools.<key>.name` ids.
 */

vi.mock("next-intl", () => ({
    useTranslations:
        () =>
            (key: string, params?: Record<string, unknown>) =>
                params && "count" in params ? `${key}#${params.count}` : key,
}))

const push = vi.fn()
vi.mock("@/i18n/navigation", () => ({
    useRouter: () => ({ push }),
    Link: ({ href, children, onClick }: { href: string; children: React.ReactNode; onClick?: () => void }) => (
        <a href={href} onClick={onClick}>
            {children}
        </a>
    ),
}))

let toolsResult: { tools: Array<AiTool>; isLoading: boolean; error: unknown; mutate: () => void }
vi.mock("../hooks/useQueryAiToolsSwr", () => ({
    useQueryAiToolsSwr: () => toolsResult,
}))

let courses: Array<MyCourse>
vi.mock("@/components/features/course/hooks/useQueryMyCoursesSwr", () => ({
    useQueryMyCoursesSwr: () => ({ courses, isLoading: false }),
}))

// HeroUI → trivial renderers. Modal renders children only when open.
vi.mock("@heroui/react", () => {
    const Passthrough = ({ children }: { children: React.ReactNode }) => <div>{children}</div>
    const Modal = ({ isOpen, children }: { isOpen: boolean; children: React.ReactNode }) =>
        isOpen ? <div data-testid="modal">{children}</div> : null
    Modal.Backdrop = Passthrough
    Modal.Container = Passthrough
    Modal.Dialog = Passthrough
    Modal.Header = Passthrough
    Modal.Body = Passthrough
    Modal.Footer = Passthrough
    return {
        Modal,
        Button: ({
            children,
            onPress,
            isDisabled,
        }: {
            children: React.ReactNode
            onPress?: () => void
            isDisabled?: boolean
        }) => (
            <button type="button" onClick={onPress} disabled={isDisabled}>
                {children}
            </button>
        ),
        Skeleton: () => <div />,
        Typography: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
    }
})

// Phosphor icons → inert spans (enumerated — a Proxy namespace breaks ESM interop).
vi.mock("@phosphor-icons/react", () => {
    const Icon = () => <span />
    return {
        SparkleIcon: Icon,
        CalendarCheckIcon: Icon,
        NotepadIcon: Icon,
        CardsIcon: Icon,
        QuestionIcon: Icon,
        BugIcon: Icon,
        BriefcaseIcon: Icon,
        GraduationCapIcon: Icon,
        CaretRightIcon: Icon,
        BookOpenIcon: Icon,
    }
})

vi.mock("@/components/blocks/async/AsyncContent", () => ({
    AsyncContent: ({ isEmpty, children }: { isEmpty?: boolean; children: React.ReactNode }) =>
        isEmpty ? <div data-testid="empty" /> : <>{children}</>,
}))

import { AiHub } from "./index"

const tool = (over: Partial<AiTool> & { key: string }): AiTool => ({
    id: over.key,
    category: "student",
    remaining: 5,
    ...over,
    key: over.key,
})

const course = (over: Partial<MyCourse> & { courseId: string }): MyCourse => ({
    title: `Course ${over.courseId}`,
    slug: over.courseId,
    completionPercent: 40,
    href: `/courses/${over.courseId}/learn`,
    isPurchased: true,
    ...over,
})

beforeEach(() => {
    push.mockReset()
    courses = []
    toolsResult = {
        tools: [
            tool({ key: "tutor" }), // intent-driven, no href
            tool({ key: "planner", href: "/ai/tools/planner" }),
            tool({ key: "summary", category: "learning", href: "/ai/tools/summary" }),
        ],
        isLoading: false,
        error: undefined,
        mutate: vi.fn(),
    }
})

afterEach(() => {
    vi.clearAllMocks()
})

/** The CTA button inside the tile named `tools.<key>.name`. */
const tileButton = (key: string): HTMLElement => {
    const tile = screen
        .getByText(`tools.${key}.name`)
        .closest("div[class*='rounded-2xl']") as HTMLElement
    const button = tile.querySelector("button")
    if (!button) throw new Error(`tile ${key} has no CTA button`)
    return button
}

describe("AiHub tile wiring", () => {
    it("filters out a dead tile (no href, not tutor) so no no-op CTA renders", () => {
        toolsResult.tools = [
            ...toolsResult.tools,
            tool({ key: "ghost" }), // dead: no href, not the tutor intent
        ]
        render(<AiHub />)
        expect(screen.getByText("tools.tutor.name")).toBeTruthy()
        expect(screen.getByText("tools.planner.name")).toBeTruthy()
        expect(screen.queryByText("tools.ghost.name")).toBeNull()
    })

    it("navigates an href tile straight to its /ai/tools/* surface", () => {
        render(<AiHub />)
        fireEvent.click(tileButton("planner"))
        expect(push).toHaveBeenCalledWith("/ai/tools/planner")
    })

    it("tutor with exactly 1 course goes straight into its learn shell (no modal)", () => {
        courses = [course({ courseId: "java" })]
        render(<AiHub />)
        fireEvent.click(tileButton("tutor"))
        expect(push).toHaveBeenCalledWith("/courses/java/learn")
        expect(screen.queryByTestId("modal")).toBeNull()
    })

    it("tutor with several courses opens the picker listing each course", () => {
        courses = [course({ courseId: "java" }), course({ courseId: "sql" })]
        render(<AiHub />)
        fireEvent.click(tileButton("tutor"))
        expect(push).not.toHaveBeenCalled()
        const modal = screen.getByTestId("modal")
        const links = Array.from(modal.querySelectorAll("a")).map((a) =>
            a.getAttribute("href"),
        )
        expect(links).toEqual(["/courses/java/learn", "/courses/sql/learn"])
        expect(screen.getByText("Course java")).toBeTruthy()
        expect(screen.getByText("Course sql")).toBeTruthy()
    })

    it("tutor with no courses opens the modal's browse-catalog CTA to /courses", () => {
        courses = []
        render(<AiHub />)
        fireEvent.click(tileButton("tutor"))
        // The picker's `t` is namespaced to `aiPlatform.tutorPicker` → bare key ids.
        const modal = screen.getByTestId("modal")
        expect(modal.textContent).toContain("emptyTitle")
        fireEvent.click(screen.getByText("browse"))
        expect(push).toHaveBeenCalledWith("/courses")
    })

    it("echoes each tile's live remaining quota", () => {
        render(<AiHub />)
        expect(screen.getAllByText("quotaRemaining#5").length).toBe(3)
    })
})
