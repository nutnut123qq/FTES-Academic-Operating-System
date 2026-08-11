import React from "react"
import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { LearnExercise, LearnLesson, LearnModule } from "../hooks/useQueryLearnCourseSwr"
import { buildMindMap, NODE_SIZE, ROOT_LABEL_FALLBACK } from "./build"
import type { MindMapNodeData } from "./build"
import { CURVED_EDGE_TYPE, curvedEdgePath } from "./CurvedEdge"
import { resolveNodeOpen } from "./open"
import { isModuleLocked, lessonStatus, moduleStatus } from "./status"

/**
 * Course mind map (interactive React-Flow redesign — change `mindmap-interactive-redesign`).
 *
 * Covers the pure model the canvas is built from:
 *  - the root carries the FULL COURSE TITLE (never an acronym), with a "—" fallback;
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

/** A real, long FTES course title — the case the old acronym mangled into "M-TCCC". */
const COURSE_TITLE = "MAE101 - Toán Cao Cấp Cho Lập Trình"

const baseBuildInput = (modules: Array<LearnModule>, expanded: Array<string> = []) => ({
    courseTitle: COURSE_TITLE,
    completionPercent: 40,
    modules,
    currentLessonId: null,
    currentModuleId: null,
    // Progressive disclosure: sections are collapsed unless listed here.
    expandedModuleIds: new Set<string>(expanded),
})

describe("buildMindMap — course-title root + exercise nodes", () => {
    const rootOf = (nodes: ReturnType<typeof buildMindMap>["nodes"]) =>
        nodes.find((node) => (node.data as MindMapNodeData).kind === "root")?.data as MindMapNodeData | undefined

    it("puts the FULL COURSE TITLE on the root node (never an acronym)", () => {
        const { nodes } = buildMindMap(baseBuildInput([moduleOf({ id: "m1", lessons: [lesson({ id: "l1" })] })]))
        expect(rootOf(nodes)?.label).toBe(COURSE_TITLE)
        expect(rootOf(nodes)?.completionPercent).toBe(40)
    })

    it("falls back to '—' when the course has no title (never an empty box)", () => {
        const modules = [moduleOf({ id: "m1", lessons: [lesson({ id: "l1" })] })]
        expect(rootOf(buildMindMap({ ...baseBuildInput(modules), courseTitle: "" }).nodes)?.label)
            .toBe(ROOT_LABEL_FALLBACK)
        expect(rootOf(buildMindMap({ ...baseBuildInput(modules), courseTitle: "   " }).nodes)?.label)
            .toBe(ROOT_LABEL_FALLBACK)
    })

    it("renders each lesson exercise as its own node, only where one exists (expanded section)", () => {
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
        const { nodes } = buildMindMap(baseBuildInput(modules, ["m1"]))
        const kinds = nodes.map((node) => (node.data as MindMapNodeData).kind)
        // 1 root + 1 module + 2 lessons + 2 exercises (l2 has none → no fabricated node)
        expect(kinds.filter((k) => k === "exercise")).toHaveLength(2)
        expect(kinds.filter((k) => k === "lesson")).toHaveLength(2)
        expect(kinds.filter((k) => k === "module")).toHaveLength(1)
    })

    it("flags the current module + lesson as 'you are here' (expanded section)", () => {
        const modules = [moduleOf({ id: "m1", lessons: [lesson({ id: "l1" })] })]
        const { nodes } = buildMindMap({
            ...baseBuildInput(modules, ["m1"]),
            currentLessonId: "l1",
            currentModuleId: "m1",
        })
        const current = nodes.filter((node) => (node.data as MindMapNodeData).isCurrent)
        expect(current.map((node) => (node.data as MindMapNodeData).kind).sort()).toEqual(["lesson", "module"])
    })
})

describe("buildMindMap — progressive disclosure (collapse / expand)", () => {
    const modules = [
        moduleOf({
            id: "m1",
            lessons: [lesson({ id: "l1", exercises: [exercise({ id: "c1", kind: "challenge", slug: "chal-1" })] })],
        }),
    ]

    it("shows ONLY section nodes by default (no lessons / exercises)", () => {
        const { nodes } = buildMindMap(baseBuildInput(modules))
        const kinds = nodes.map((node) => (node.data as MindMapNodeData).kind)
        expect(kinds.filter((k) => k === "module")).toHaveLength(1)
        expect(kinds.filter((k) => k === "lesson")).toHaveLength(0)
        expect(kinds.filter((k) => k === "exercise")).toHaveLength(0)
        const moduleNode = nodes.find((node) => (node.data as MindMapNodeData).kind === "module")
        expect((moduleNode?.data as MindMapNodeData).hasChildren).toBe(true)
        expect((moduleNode?.data as MindMapNodeData).isExpanded).toBe(false)
    })

    it("reveals the section's lessons + exercises once it is expanded", () => {
        const { nodes } = buildMindMap(baseBuildInput(modules, ["m1"]))
        const kinds = nodes.map((node) => (node.data as MindMapNodeData).kind)
        expect(kinds.filter((k) => k === "lesson")).toHaveLength(1)
        expect(kinds.filter((k) => k === "exercise")).toHaveLength(1)
        const moduleNode = nodes.find((node) => (node.data as MindMapNodeData).kind === "module")
        expect((moduleNode?.data as MindMapNodeData).isExpanded).toBe(true)
    })

    it("carries the section + lesson descriptions onto their nodes", () => {
        const described = [
            moduleOf({
                id: "m1",
                description: "Mô tả phần",
                lessons: [lesson({ id: "l1", description: "Mô tả bài" })],
            }),
        ]
        const { nodes } = buildMindMap(baseBuildInput(described, ["m1"]))
        const moduleNode = nodes.find((node) => (node.data as MindMapNodeData).kind === "module")
        const lessonNode = nodes.find((node) => (node.data as MindMapNodeData).kind === "lesson")
        expect((moduleNode?.data as MindMapNodeData).description).toBe("Mô tả phần")
        expect((lessonNode?.data as MindMapNodeData).description).toBe("Mô tả bài")
    })
})

describe("buildMindMap — connectors are CURVED, not straight spokes", () => {
    const modules = [
        moduleOf({
            id: "m1",
            lessons: [lesson({ id: "l1", exercises: [exercise({ id: "c1", kind: "challenge", slug: "chal-1" })] })],
        }),
    ]

    it("emits every tree link as the custom curved edge type", () => {
        const { edges } = buildMindMap(baseBuildInput(modules, ["m1"]))
        expect(edges.length).toBeGreaterThan(0)
        expect(edges.every((edge) => edge.type === CURVED_EDGE_TYPE)).toBe(true)
        // No link is left as the old straight spoke.
        expect(edges.some((edge) => edge.type === "straight")).toBe(false)
    })

    it("draws a smooth cubic bezier that flows along the dominant (horizontal) axis", () => {
        // A right-branch spoke with a vertical offset → a horizontal-dominant cubic S-curve.
        const path = curvedEdgePath(0, 0, 400, 120)
        // Cubic (`C`), not a quadratic bow (`Q`) or a straight line (`L`).
        expect(path).toMatch(/^M 0,0 C /)
        const control = path.match(/C ([-\d.]+),([-\d.]+) ([-\d.]+),([-\d.]+) /)
        expect(control).not.toBeNull()
        const [c1x, c1y, c2x, c2y] = [
            Number(control?.[1]),
            Number(control?.[2]),
            Number(control?.[3]),
            Number(control?.[4]),
        ]
        // Horizontal-dominant → both control points slide along X to the mid-span, each held
        // at its OWN endpoint's y, so the curve leaves the source and enters the target
        // horizontally (0 + 400·0.5 and 400 − 400·0.5 = 200; y stays at 0 then 120).
        expect(c1x).toBeCloseTo(200)
        expect(c2x).toBeCloseTo(200)
        expect(c1y).toBeCloseTo(0)
        expect(c2y).toBeCloseTo(120)
        // The straight source→target line passes (200, 60); the control points sit OFF it → curve.
        expect(c1y).not.toBeCloseTo(60)
    })

    it("flows in the branch's own direction — right branch bends right, left branch bends left", () => {
        // Direction is derived from the geometry (sign of dx), not a fixed rotational bow.
        const rightControlX = Number(curvedEdgePath(0, 0, 400, 100).match(/C ([-\d.]+),/)?.[1])
        const leftControlX = Number(curvedEdgePath(0, 0, -400, 100).match(/C ([-\d.]+),/)?.[1])
        expect(rightControlX).toBeGreaterThan(0)
        expect(leftControlX).toBeLessThan(0)
    })
})

describe("buildMindMap — cards never overlap (worst case)", () => {
    /** Axis-aligned bounding box of a placed node, from its top-left position + known footprint. */
    const boxOf = (node: { position: { x: number; y: number }; data: MindMapNodeData }) => {
        const size = NODE_SIZE[node.data.kind]
        return {
            left: node.position.x,
            top: node.position.y,
            right: node.position.x + size.w,
            bottom: node.position.y + size.h,
        }
    }
    const overlaps = (a: ReturnType<typeof boxOf>, b: ReturnType<typeof boxOf>) =>
        a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom

    it("keeps every card's bounding box disjoint for a dense course (many sections + lessons + exercises)", () => {
        // Worst case: 8 sections, 7 lessons each, half the lessons carrying 2 exercises — ALL expanded.
        const modules = Array.from({ length: 8 }, (_unused, m) =>
            moduleOf({
                id: `m${m}`,
                order: m + 1,
                lessons: Array.from({ length: 7 }, (_l, l) =>
                    lesson({
                        id: `m${m}-l${l}`,
                        exercises:
                            l % 2 === 0
                                ? [
                                    exercise({ id: `m${m}-l${l}-x1`, kind: "challenge", slug: `s-${m}-${l}` }),
                                    exercise({ id: `m${m}-l${l}-x2`, kind: "assignment" }),
                                ]
                                : [],
                    }),
                ),
            }),
        )
        const { nodes } = buildMindMap(baseBuildInput(modules, modules.map((mod) => mod.id)))
        const boxes = nodes.map((node) => ({ id: node.id, box: boxOf(node as never) }))
        for (let i = 0; i < boxes.length; i += 1) {
            for (let j = i + 1; j < boxes.length; j += 1) {
                expect(
                    overlaps(boxes[i].box, boxes[j].box),
                    `${boxes[i].id} overlaps ${boxes[j].id}`,
                ).toBe(false)
            }
        }
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
// graph + the open handler so the container wiring (root label, routing, gate) is testable.
vi.mock("./MindMapCanvas", () => ({
    MindMapCanvas: ({
        graph,
        onOpenNode,
        onToggleModule,
    }: {
        graph: { nodes: Array<{ id: string; data: MindMapNodeData }> }
        onOpenNode: (data: MindMapNodeData) => void
        onToggleModule: (moduleId: string) => void
    }) => (
        <div>
            <span data-testid="root-label">
                {graph.nodes.find((node) => node.data.kind === "root")?.data.label}
            </span>
            {graph.nodes
                .filter((node) => node.data.kind !== "root")
                .map((node) => (
                    <button
                        key={node.id}
                        data-testid={`${node.data.kind}-${node.id}`}
                        type="button"
                        onClick={() =>
                            // A section click toggles expand; a lesson / exercise click opens.
                            node.data.kind === "module"
                                ? onToggleModule(node.data.moduleId)
                                : onOpenNode(node.data)
                        }
                    >
                        {node.data.label}
                    </button>
                ))}
        </div>
    ),
}))

import { MindMap } from "./index"

const mountWith = (modules: Array<LearnModule>, title: string = COURSE_TITLE) => {
    courseMock.mockReturnValue({
        course: { id: "uuid-a", header: { title } },
        modules,
        // `subjectCode` stays populated on purpose: the root must show the TITLE anyway.
        header: { title, progressPercent: 0, continueLessonId: null, subjectCode: "MAE101" },
        error: undefined,
        mutate: vi.fn(),
    })
    return render(<MindMap />)
}

beforeEach(() => {
    push.mockClear()
})

describe("MindMap container — course title on the root, gate on a locked node", () => {
    it("shows the FULL course title on the root node (not the subject code / an acronym)", () => {
        mountWith([moduleOf({ id: "m1", lessons: [lesson({ id: "l1" })] })])
        expect(screen.getByTestId("root-label").textContent).toBe(COURSE_TITLE)
    })

    it("shows '—' on the root when the course header carries no title", () => {
        mountWith([moduleOf({ id: "m1", lessons: [lesson({ id: "l1" })] })], "")
        expect(screen.getByTestId("root-label").textContent).toBe(ROOT_LABEL_FALLBACK)
    })

    it("shows only sections until one is expanded, then collapses again on a second click", () => {
        mountWith([moduleOf({ id: "m1", lessons: [lesson({ id: "l1", accessLevel: "FULL", isLocked: false })] })])
        // first paint: section node present, lesson hidden
        expect(screen.getByTestId("module-m:m1")).toBeTruthy()
        expect(screen.queryByTestId("lesson-l:l1")).toBeNull()
        // expand → lesson appears
        fireEvent.click(screen.getByTestId("module-m:m1"))
        expect(screen.getByTestId("lesson-l:l1")).toBeTruthy()
        // collapse → lesson hidden again
        fireEvent.click(screen.getByTestId("module-m:m1"))
        expect(screen.queryByTestId("lesson-l:l1")).toBeNull()
    })

    it("opens the package gate instead of routing into a fully locked lesson", () => {
        mountWith([moduleOf({ id: "m1", lessons: [lesson({ id: "l1" })] })])
        expect(screen.queryByTestId("gate")).toBeNull()
        // sections start collapsed — expand the section to reach its lesson node
        fireEvent.click(screen.getByTestId("module-m:m1"))
        fireEvent.click(screen.getByTestId("lesson-l:l1"))
        expect(push).not.toHaveBeenCalled()
        expect(screen.getByTestId("gate").textContent).toBe("l1")
    })

    it("routes into a lesson the viewer may actually enter", () => {
        mountWith([moduleOf({ id: "m1", lessons: [lesson({ id: "l1", accessLevel: "PREVIEW", isLocked: false })] })])
        fireEvent.click(screen.getByTestId("module-m:m1"))
        fireEvent.click(screen.getByTestId("lesson-l:l1"))
        expect(push).toHaveBeenCalledWith("/courses/khoa-a/learn/content/modules/m1/contents/l1")
    })
})
