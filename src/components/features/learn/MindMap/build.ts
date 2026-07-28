import type { Edge, Node } from "@xyflow/react"
import type { LearnModule } from "../hooks/useQueryLearnCourseSwr"
import {
    exerciseStatus,
    isExerciseLocked,
    isModuleLocked,
    lessonStatus,
    moduleStatus,
    type MindMapNodeStatus,
} from "./status"

/** React Flow node type id for the course root (subject code + completion ring). */
export const ROOT_NODE_TYPE = "mindMapRoot" as const

/** React Flow node type id for a content node (module / lesson / exercise). */
export const CONTENT_NODE_TYPE = "mindMapContent" as const

/** Which tree level a content node sits on — drives its icon, size and copy. */
export type MindMapNodeKind = "module" | "lesson" | "exercise"

/**
 * Data carried by every mind-map node inside React Flow. Content nodes carry the
 * typed 3-state {@link MindMapNodeStatus} (the field the backend phase will feed),
 * the routing ids, and the premium `isLocked` flag; the root carries the subject
 * code + overall completion percent.
 */
export interface MindMapNodeData extends Record<string, unknown> {
    /** "root" for the subject-code node, otherwise the content level. */
    kind: "root" | MindMapNodeKind
    /** Primary label (subject code on the root, title otherwise). */
    label: string
    /** 3-state completion status (content nodes only; `notStarted` on the root, unused). */
    status: MindMapNodeStatus
    /** Premium paywall flag for this viewer (orthogonal to `status`). */
    isLocked: boolean
    /** True when this node owns the viewer's resume pointer ("you are here"). */
    isCurrent: boolean
    /** Owning module id — the route segment for lessons/exercises. */
    moduleId: string
    /** Owning lesson id (lesson + exercise nodes). */
    lessonId?: string
    /** Exercise flavour (challenge vs assignment) — picks icon + solver route. */
    exerciseKind?: "challenge" | "assignment"
    /** Raw BE exercise type, fed to the solver-icon/type normaliser. */
    exerciseType?: string
    /** Challenge slug the solver route keys on (challenges only). */
    slug?: string
    /** Lessons the viewer has read in this module (module nodes). */
    lessonsRead?: number
    /** Total lessons in this module (module nodes). */
    lessonsTotal?: number
    /** Overall course completion percent 0-100 (root only). */
    completionPercent?: number
}

/** Nodes + edges produced by {@link buildMindMap}. */
export interface MindMapGraph {
    nodes: Array<Node<MindMapNodeData>>
    edges: Array<Edge>
}

/** Inputs the mind-map graph is laid out from. */
export interface BuildMindMapInput {
    /** Resolved root label — the SUBJECT CODE (or a short fallback code). */
    subjectCode: string
    /** Overall course completion percent 0-100 (drives the root ring). */
    completionPercent: number
    /** The course module tree (already ordered). */
    modules: Array<LearnModule>
    /** The lesson the viewer resumes at ("you are here"), if any. */
    currentLessonId: string | null
    /** The module that owns {@link currentLessonId} ("you are here"), if any. */
    currentModuleId: string | null
}

/** Horizontal column position (px, left edge) per tree level. */
const COLUMN_X: Record<"root" | MindMapNodeKind, number> = {
    root: 0,
    module: 360,
    lesson: 720,
    exercise: 1080,
}

/** Approximate node height per level (px) — used to vertically centre parents on children. */
const NODE_HEIGHT: Record<"root" | MindMapNodeKind, number> = {
    root: 128,
    module: 96,
    lesson: 76,
    exercise: 68,
}

/** Vertical slot height allotted to each leaf row (px). */
const ROW_HEIGHT = 92

/** Average of a list of numbers (falls back to 0 for an empty list). */
const average = (values: Array<number>): number =>
    values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length

/** Stable node id for a nested exercise (namespaced by its lesson to stay unique). */
const exerciseNodeId = (lessonId: string, exerciseId: string, kind: string): string =>
    `x:${lessonId}:${kind}:${exerciseId}`

/** Edge style shared by every tree link (accent stroke; the current path is emphasised). */
const edgeStyle = (isCurrent: boolean) => ({
    stroke: "var(--accent)",
    strokeWidth: isCurrent ? 2.5 : 1.5,
    opacity: isCurrent ? 1 : 0.4,
})

/**
 * Builds a tidy left→right tree of the course: SUBJECT-CODE root → module cards →
 * lesson cards → exercise cards (challenges/assignments). Ported from StarCI's
 * React-Flow `build` (custom node types + Bezier edges), but adapted to a
 * hierarchical dendrogram because FTES renders lessons AND exercises as first-class
 * nodes rather than expand-on-click.
 *
 * Layout is deterministic: each leaf (exercise, or a childless lesson/module) takes
 * one row; every parent is centred on the mean Y of its children, so columns never
 * overlap and the tree reads cleanly under pan/zoom.
 *
 * Node states come straight from the per-viewer completion signals on the learn
 * tree ({@link moduleStatus}/{@link lessonStatus}/{@link exerciseStatus}); the
 * root shows the SUBJECT CODE (not the long, uneven course name) plus the % ring.
 */
export const buildMindMap = ({
    subjectCode,
    completionPercent,
    modules,
    currentLessonId,
    currentModuleId,
}: BuildMindMapInput): MindMapGraph => {
    const nodes: Array<Node<MindMapNodeData>> = []
    const edges: Array<Edge> = []

    const rootId = "root"
    let cursorY = 0
    /** Claim one leaf row and return its centre Y. */
    const claimRow = (): number => {
        const centerY = cursorY + ROW_HEIGHT / 2
        cursorY += ROW_HEIGHT
        return centerY
    }
    /** Push a node placed by its CENTRE Y (converted to React Flow's top-left origin). */
    const placeNode = (
        id: string,
        kind: "root" | MindMapNodeKind,
        centerY: number,
        data: MindMapNodeData,
    ) => {
        nodes.push({
            id,
            type: kind === "root" ? ROOT_NODE_TYPE : CONTENT_NODE_TYPE,
            position: { x: COLUMN_X[kind], y: centerY - NODE_HEIGHT[kind] / 2 },
            data,
        })
    }

    const moduleCenters: Array<number> = []

    for (const module of modules) {
        const modLocked = isModuleLocked(module)
        const modStatus = moduleStatus(module)
        const lessonsRead = module.lessons.filter((lesson) => lesson.isCompleted).length
        const lessonCenters: Array<number> = []

        for (const lesson of module.lessons) {
            const exerciseCenters: Array<number> = []

            for (const exercise of lesson.exercises) {
                const exCenterY = claimRow()
                exerciseCenters.push(exCenterY)
                const exId = exerciseNodeId(lesson.id, exercise.id, exercise.kind)
                placeNode(exId, "exercise", exCenterY, {
                    kind: "exercise",
                    label: exercise.title,
                    status: exerciseStatus(exercise, lesson),
                    isLocked: isExerciseLocked(lesson),
                    isCurrent: false,
                    moduleId: module.id,
                    lessonId: lesson.id,
                    exerciseKind: exercise.kind,
                    exerciseType: exercise.type,
                    slug: exercise.slug,
                })
                edges.push({
                    id: `e:${lesson.id}:${exId}`,
                    source: `l:${lesson.id}`,
                    target: exId,
                    style: edgeStyle(false),
                })
            }

            const lessonCenterY = exerciseCenters.length > 0 ? average(exerciseCenters) : claimRow()
            lessonCenters.push(lessonCenterY)
            const lessonId = `l:${lesson.id}`
            const lessonIsCurrent = lesson.id === currentLessonId
            placeNode(lessonId, "lesson", lessonCenterY, {
                kind: "lesson",
                label: lesson.title,
                status: lessonStatus(lesson),
                isLocked: lesson.isLocked,
                isCurrent: lessonIsCurrent,
                moduleId: module.id,
                lessonId: lesson.id,
            })
            edges.push({
                id: `e:${module.id}:${lessonId}`,
                source: `m:${module.id}`,
                target: lessonId,
                animated: lessonIsCurrent,
                style: edgeStyle(lessonIsCurrent),
            })
        }

        const moduleCenterY = lessonCenters.length > 0 ? average(lessonCenters) : claimRow()
        moduleCenters.push(moduleCenterY)
        const moduleId = `m:${module.id}`
        const moduleIsCurrent = module.id === currentModuleId
        placeNode(moduleId, "module", moduleCenterY, {
            kind: "module",
            label: `${module.order}. ${module.title}`,
            status: modStatus,
            isLocked: modLocked,
            isCurrent: moduleIsCurrent,
            moduleId: module.id,
            lessonsRead,
            lessonsTotal: module.lessons.length,
        })
        edges.push({
            id: `e:${rootId}:${moduleId}`,
            source: rootId,
            target: moduleId,
            animated: moduleIsCurrent,
            style: edgeStyle(moduleIsCurrent),
        })
    }

    const rootCenterY = average(moduleCenters)
    placeNode(rootId, "root", rootCenterY, {
        kind: "root",
        label: subjectCode,
        status: "notStarted",
        isLocked: false,
        isCurrent: false,
        moduleId: "",
        completionPercent,
    })

    return { nodes, edges }
}

/**
 * Resolves the root label: the linked SUBJECT CODE when the course has one (e.g.
 * "CSD201"), otherwise a short derived course code. Using the code — not the long,
 * uneven course title — keeps the root node compact and every map visually even.
 *
 * The fallback is a stable uppercase acronym of the title's significant words
 * (capped at 6 chars), degrading to a trimmed course-id slug when the title is empty.
 */
export const resolveRootCode = (
    subjectCode: string | null | undefined,
    courseTitle: string,
    courseId: string,
): string => {
    const code = subjectCode?.trim()
    if (code) {
        return code
    }
    const acronym = courseTitle
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 6)
        .map((word) => word[0]?.toUpperCase() ?? "")
        .join("")
    if (acronym.length >= 2) {
        return acronym
    }
    return courseId.slice(0, 8).toUpperCase() || "—"
}
