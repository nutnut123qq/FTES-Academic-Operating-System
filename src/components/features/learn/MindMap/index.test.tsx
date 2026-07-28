import React from "react"
import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { LearnExercise, LearnLesson, LearnModule } from "../hooks/useQueryLearnCourseSwr"
import { buildMindMap, resolveRootCode } from "./build"
import type { MindMapNodeData } from "./build"
import { resolveNodeOpen } from "./open"
import { isModuleLocked, lessonStatus, moduleStatus } from "./status"

/**
 * Course mind map (interactive React-Flow redesign — change `mindmap-interactive-redesign`).
 *
 * Covers the pure model the canvas is built from:
 *  - the root carries the SUBJECT CODE (not the long course title), with a fallback;
 *  - exercises (challenges / assignments) become their own child nodes, only where the
 *    data says one exists (no fabrication);
 *  - the typed 3-state completion status is derived from the per-viewer signals; the
 *    premium lock still follows the VIEWER's lock (not the static premium flag);
 *  - clicking a node routes / opens the same package gate the content-map opens.
 */

const exercise = (over: Partial<LearnExercise> & { id: string; kind: "challenge" | "assignment" }): LearnExercise => ({
    title: `Bài tập ${over.id}`,
    type: over.kind === "challenge" ? "CODE" : "",
    ...over,
})

const lesson = (over: Partial<LearnLesson> & { id: string }): LearnLesson => ({
    title: `Bài ${over.id}`,
    description: "",
    readTimeLabel: "",
    contentType: "VIDEO",
    isCompleted: false,
    isPremium: true,
    isLocked: true,
    accessLevel: "NONE",
    packageSlugs: [],
    exercises: [],
    ...over,
})

const moduleOf = (over: Partial<LearnModule> & { id: string; lessons: Array<LearnLesson> }): LearnModule => ({
    order: 1,
    title: `Học phần ${over.id}`,
    description: "",
    ...over,
})

const baseBuildInput = (modules: Array<LearnModule>) => ({
    subjectCode: "CSD201",
    completionPercent: 40,
    modules,
    currentLessonId: null,
    currentModuleId: null,
})

describe("buildMindMap — subject-code root + exercise nodes", () => {
    it("puts the SUBJECT CODE on the root node (not the course title)", () => {
        const { nodes } = buildMindMap(baseBuildInput([moduleOf({ id: "m1", lessons: [lesson({ id: "l1" })] })]))
        const root = nodes.find((node) => (node.data as MindMapNodeData).kind === "root")
        expect((root?.data as MindMapNodeData).label).toBe("CSD201")
        expect((root?.data as MindMapNodeData).completionPercent).toBe(40)
    })

    it("renders each lesson exercise as its own node, only where one exists", () => {
        const modules = [
            moduleOf({
                id: "m1",
                lessons: [
                    lesson({
                        id: "l1",
                        exercises: [
                            exercise({ id: "c1", kind: "challenge", slug: "chal-1" }),
                            exercise({ id: "a1", kind: "assignment" }),
                        ],
                    }),
                    lesson({ id: "l2", exercises: [] }),
                ],
            }),
        ]
        const { nodes } = buildMindMap(baseBuildInput(modules))
        const kinds = nodes.map((node) => (node.data as MindMapNodeData).kind)
        // 1 root + 1 module + 2 lessons + 2 exercises (l2 has none → no fabricated node)
        expect(kinds.filter((k) => k === "exercise")).toHaveLength(2)
        expect(kinds.filter((k) => k === "lesson")).toHaveLength(2)
        expect(kinds.filter((k) => k === "module")).toHaveLength(1)
    })

    it("flags the current module + lesson as 'you are here'", () => {
        const modules = [moduleOf({ id: "m1", lessons: [lesson({ id: "l1" })] })]
        const { nodes } = buildMindMap({ ...baseBuildInput(modules), currentLessonId: "l1", currentModuleId: "m1" })
        const current = nodes.filter((node) => (node.data as MindMapNodeData).isCurrent)
        expect(current.map((node) => (node.data as MindMapNodeData).kind).sort()).toEqual(["lesson", "module"])
    })
})

describe("resolveRootCode — subject code with a short fallback", () => {
    it("uses the linked subject code when present", () => {
        expect(resolveRootCode("CSD201", "Cấu trúc dữ liệu", "khoa-a")).toBe("CSD201")
    })
    it("falls back to a short acronym of the title", () => {
        expect(resolveRootCode(null, "Cau Truc Du Lieu", "khoa-a")).toBe("CTDL")
    })
})

describe("status — typed 3-state derived from viewer completion", () => {
    it("module: all done → completed, some done → inProgress, none → notStarted", () => {
        const done = moduleOf({ id: "m", lessons: [lesson({ id: "a", isCompleted: true }), lesson({ id: "b", isCompleted: true })] })
        const partial = moduleOf({ id: "m", lessons: [lesson({ id: "a", isCompleted: true }), lesson({ id: "b" })] })
        const none = moduleOf({ id: "m", lessons: [lesson({ id: "a" }), lesson({ id: "b" })] })
        expect(moduleStatus(done)).toBe("completed")
        expect(moduleStatus(partial)).toBe("inProgress")
        expect(moduleStatus(none)).toBe("notStarted")
    })

    it("lesson: completed → completed, else notStarted", () => {
        expect(lessonStatus(lesson({ id: "l", isCompleted: true }))).toBe("completed")
        expect(lessonStatus(lesson({ id: "l" }))).toBe("notStarted")
    })

    it("locks a module only when EVERY lesson is locked for the viewer (not premium-but-owned)", () => {
        const owned = moduleOf({
            id: "m",
            lessons: [lesson({ id: "a", isPremium: true, isLocked: false }), lesson({ id: "b", isPremium: true, isLocked: false })],
        })
        const gated = moduleOf({ id: "m", lessons: [lesson({ id: "a" }), lesson({ id: "b" })] })
        expect(isModuleLocked(owned)).toBe(false)
        expect(isModuleLocked(gated)).toBe(true)
    })
})

describe("resolveNodeOpen — routes / gates like the content-map rail", () => {
    const courseId = "khoa-a"
    const nodeData = (over: Partial<MindMapNodeData> & { kind: MindMapNodeData["kind"] }): MindMapNodeData => ({
        label: "",
        status: "notStarted",
        isLocked: false,
        isCurrent: false,
        moduleId: "m1",
        ...over,
    })

    it("module → opens the first lesson the viewer may enter", () => {
        const modules = [
            moduleOf({
                id: "m1",
                lessons: [lesson({ id: "l1", accessLevel: "NONE" }), lesson({ id: "l2", accessLevel: "PREVIEW", isLocked: false })],
            }),
        ]
        const action = resolveNodeOpen(nodeData({ kind: "module" }), modules, courseId)
        expect(action).toEqual({ type: "route", href: "/courses/khoa-a/learn/content/modules/m1/contents/l2" })
    })

    it("module fully locked → opens the package gate on its first lesson", () => {
        const modules = [moduleOf({ id: "m1", lessons: [lesson({ id: "l1" }), lesson({ id: "l2" })] })]
        const action = resolveNodeOpen(nodeData({ kind: "module" }), modules, courseId)
        expect(action?.type).toBe("gate")
        expect(action?.type === "gate" && action.lesson.id).toBe("l1")
    })

    it("challenge exercise → routes to its solver via the slug", () => {
        const modules = [
            moduleOf({
                id: "m1",
                lessons: [lesson({ id: "l1", accessLevel: "FULL", isLocked: false, exercises: [exercise({ id: "c1", kind: "challenge", slug: "chal-1" })] })],
            }),
        ]
        const action = resolveNodeOpen(
            nodeData({ kind: "exercise", lessonId: "l1", exerciseKind: "challenge", slug: "chal-1" }),
            modules,
            courseId,
        )
        expect(action).toEqual({ type: "route", href: "/courses/khoa-a/learn/content/modules/m1/contents/l1/challenges/chal-1" })
    })

    it("locked exercise → gates its parent lesson", () => {
        const modules = [moduleOf({ id: "m1", lessons: [lesson({ id: "l1", exercises: [exercise({ id: "c1", kind: "challenge" })] })] })]
        const action = resolveNodeOpen(
            nodeData({ kind: "exercise", lessonId: "l1", exerciseKind: "challenge", isLocked: true }),
            modules,
            courseId,
        )
        expect(action?.type).toBe("gate")
    })
})

// ---------------------------------------------------------------- container wiring

const courseMock = vi.fn()
const push = vi.fn()

vi.mock("next-intl", () => ({
    useTranslations: () => (key: string, params?: Record<string, unknown>) =>
        params ? `${key}:${JSON.stringify(params)}` : key,
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
vi.mock("../hooks/useQueryLearnCourseSwr", () => ({ useQueryLearnCourseSwr: () => courseMock() }))
// The React-Flow canvas is DOM-measuring; stub it to a light surface that exposes the
// graph + the open handler so the container wiring (subject code, routing, gate) is testable.
vi.mock("./MindMapCanvas", () => ({
    MindMapCanvas: ({ graph, onOpenNode }: { graph: { nodes: Array<{ id: string; data: MindMapNodeData }> }; onOpenNode: (data: MindMapNodeData) => void }) => (
        <div>
            <span data-testid="root-code">
                {graph.nodes.find((node) => node.data.kind === "root")?.data.label}
            </span>
            {graph.nodes
                .filter((node) => node.data.kind !== "root")
                .map((node) => (
                    <button key={node.id} data-testid={`${node.data.kind}-${node.id}`} type="button" onClick={() => onOpenNode(node.data)}>
                        {node.data.label}
                    </button>
                ))}
        </div>
    ),
}))

import { MindMap } from "./index"

const mountWith = (modules: Array<LearnModule>, subjectCode: string | null = "CSD201") => {
    courseMock.mockReturnValue({
        course: { id: "uuid-a", header: { title: "Khóa A" } },
        modules,
        header: { title: "Khóa A", progressPercent: 0, continueLessonId: null, subjectCode },
        error: undefined,
        mutate: vi.fn(),
    })
    return render(<MindMap />)
}

beforeEach(() => {
    push.mockClear()
})

describe("MindMap container — subject code on the root, gate on a locked node", () => {
    it("shows the linked subject code on the root node", () => {
        mountWith([moduleOf({ id: "m1", lessons: [lesson({ id: "l1" })] })])
        expect(screen.getByTestId("root-code").textContent).toBe("CSD201")
    })

    it("opens the package gate instead of routing into a fully locked lesson", () => {
        mountWith([moduleOf({ id: "m1", lessons: [lesson({ id: "l1" })] })])
        expect(screen.queryByTestId("gate")).toBeNull()
        fireEvent.click(screen.getByTestId("lesson-l:l1"))
        expect(push).not.toHaveBeenCalled()
        expect(screen.getByTestId("gate").textContent).toBe("l1")
    })

    it("routes into a lesson the viewer may actually enter", () => {
        mountWith([moduleOf({ id: "m1", lessons: [lesson({ id: "l1", accessLevel: "PREVIEW", isLocked: false })] })])
        fireEvent.click(screen.getByTestId("lesson-l:l1"))
        expect(push).toHaveBeenCalledWith("/courses/khoa-a/learn/content/modules/m1/contents/l1")
    })
})
