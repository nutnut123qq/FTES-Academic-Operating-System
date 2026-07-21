import React from "react"
import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { LearnLesson, LearnModule } from "../hooks/useQueryLearnCourseSwr"

/**
 * Component — the course mind map (change `learn-gate-uses-real-signals`).
 *
 * Regressions under test:
 *  - modules were tinted "locked" from `isPremium` (`!lesson.free`, a STATIC property of
 *    the content) instead of `isLocked` (the per-viewer lock), so a learner who had
 *    ALREADY PAID still saw every premium module greyed out;
 *  - clicking a locked node pushed straight into the locked lesson, while the content
 *    rail on the same data blocks and opens the package gate.
 */

const courseMock = vi.fn()
const push = vi.fn()

vi.mock("next-intl", () => ({
    useTranslations: () => (key: string, params?: Record<string, unknown>) =>
        params ? `${key}:${JSON.stringify(params)}` : key,
}))
vi.mock("@phosphor-icons/react", () => ({ ArrowRightIcon: () => <span /> }))
vi.mock("@heroui/react", () => ({
    Button: ({ children, onPress }: { children: React.ReactNode; onPress?: () => void }) => (
        <button type="button" onClick={onPress}>
            {children}
        </button>
    ),
    Typography: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
    cn: (...a: Array<unknown>) => a.filter(Boolean).join(" "),
}))
vi.mock("next/navigation", () => ({ useParams: () => ({ courseId: "khoa-a" }) }))
vi.mock("@/i18n/navigation", () => ({ useRouter: () => ({ push }) }))
vi.mock("@/components/blocks/async/AsyncContent", () => ({
    AsyncContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))
vi.mock("@/components/blocks/skeleton/Skeleton", () => ({ Skeleton: () => <div /> }))
vi.mock("@/components/features/course/PackageGateModal", () => ({
    PackageGateModal: ({ lessonId }: { lessonId: string }) => <div data-testid="gate">{lessonId}</div>,
}))
vi.mock("../hooks/useQueryLearnCourseSwr", () => ({
    useQueryLearnCourseSwr: () => courseMock(),
}))

import { MindMap } from "./index"

const lesson = (over: Partial<LearnLesson> & { id: string }): LearnLesson => ({
    title: `Bài ${over.id}`,
    description: "",
    readTimeLabel: "",
    isCompleted: false,
    isPremium: true,
    isLocked: true,
    accessLevel: "NONE",
    packageSlugs: [],
    ...over,
})

const module1 = (lessons: Array<LearnLesson>): LearnModule => ({
    id: "m1",
    order: 1,
    title: "Học phần 1",
    description: "",
    lessons,
})

const mountWith = (modules: Array<LearnModule>) => {
    courseMock.mockReturnValue({
        course: { id: "uuid-a", header: { title: "Khóa A", continueLessonId: null }, modules },
        modules,
        header: { title: "Khóa A", progressPercent: 0, continueLessonId: null },
        error: undefined,
        mutate: vi.fn(),
    })
    return render(<MindMap />)
}

/** The SVG circle of the (single) module node — its classes carry the status fill. */
const nodeCircle = () => document.querySelector("g[role='button'] circle")

beforeEach(() => {
    push.mockClear()
})

describe("MindMap — locked tint follows the VIEWER's lock, not the content flag", () => {
    it("does not grey out premium modules for a learner who already owns them", () => {
        // every lesson is premium content, but nothing is locked FOR THIS VIEWER
        mountWith([
            module1([
                lesson({ id: "l1", isPremium: true, isLocked: false, accessLevel: "FULL" }),
                lesson({ id: "l2", isPremium: true, isLocked: false, accessLevel: "FULL" }),
            ]),
        ])
        expect(nodeCircle()?.getAttribute("class")).toContain("fill-default")
        expect(nodeCircle()?.getAttribute("class")).not.toContain("fill-separator")
    })

    it("greys out a module only when every lesson is locked for the viewer", () => {
        mountWith([module1([lesson({ id: "l1" }), lesson({ id: "l2" })])])
        expect(nodeCircle()?.getAttribute("class")).toContain("fill-separator")
    })

    it("keeps a module open-looking when at least one lesson is unlocked", () => {
        mountWith([
            module1([
                lesson({ id: "l1" }),
                lesson({ id: "l2", isLocked: false, accessLevel: "PREVIEW" }),
            ]),
        ])
        expect(nodeCircle()?.getAttribute("class")).not.toContain("fill-separator")
    })
})

describe("MindMap — opening a node behaves like the content rail", () => {
    it("opens the first lesson the viewer may actually enter", () => {
        mountWith([
            module1([
                lesson({ id: "l1", accessLevel: "NONE" }),
                lesson({ id: "l2", accessLevel: "PREVIEW", isLocked: false }),
            ]),
        ])
        fireEvent.click(screen.getByLabelText("Học phần 1"))
        expect(push).toHaveBeenCalledWith("/courses/khoa-a/learn/content/modules/m1/contents/l2")
    })

    it("opens the package gate instead of pushing into a fully locked module", () => {
        mountWith([module1([lesson({ id: "l1" }), lesson({ id: "l2" })])])
        expect(screen.queryByTestId("gate")).toBeNull()
        fireEvent.click(screen.getByLabelText("Học phần 1"))
        expect(push).not.toHaveBeenCalled()
        expect(screen.getByTestId("gate").textContent).toBe("l1")
    })
})
