import type { Edge, Node } from "@xyflow/react"
import type { LearnLesson, LearnModule } from "../hooks/useQueryLearnCourseSwr"
import { CURVED_EDGE_TYPE } from "./CurvedEdge"
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
    /**
     * Short subtitle shown under the title on module + lesson nodes (the section /
     * lesson description from the course outline). Empty / absent → no subtitle.
     */
    description?: string
    /** 3-state completion status (content nodes only; `notStarted` on the root, unused). */
    status: MindMapNodeStatus
    /** Premium paywall flag for this viewer (orthogonal to `status`). */
    isLocked: boolean
    /** True when this node owns the viewer's resume pointer ("you are here"). */
    isCurrent: boolean
    /** True when the progress assistant recommends this lesson as the next step. */
    isRecommended?: boolean
    /** Module nodes only: true when this section is expanded (its children are shown). */
    isExpanded?: boolean
    /** Module nodes only: true when this section has at least one lesson to reveal. */
    hasChildren?: boolean
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
    /** The lesson the progress assistant recommends next — tags its node `isRecommended`. */
    recommendedLessonId?: string | null
    /**
     * The set of EXPANDED section (module) ids. Progressive disclosure: a section's
     * lesson + exercise child nodes are emitted ONLY when its id is in this set. An
     * empty set (the default first-paint state) renders the section ring alone.
     */
    expandedModuleIds: ReadonlySet<string>
}

/**
 * Node box (px) per level — the KNOWN FOOTPRINT of each card, used both to convert a
 * CENTRE to React Flow's top-left origin AND to guarantee the layout leaves clear gaps
 * (the row/column gaps below are derived from these). Exported so a test can rebuild each
 * node's bounding box from `build()` output and assert no two cards overlap.
 */
export const NODE_SIZE: Record<"root" | MindMapNodeKind, { w: number; h: number }> = {
    root: { w: 240, h: 128 },
    module: { w: 280, h: 100 },
    lesson: { w: 240, h: 84 },
    exercise: { w: 220, h: 64 },
}

// ---------------------------------------------------- two-sided tidy-tree geometry
// The map is a horizontal mind map: the subject-code root sits at the origin and the
// sections branch to the LEFT and RIGHT (balanced, alternating by order). Each branch is
// a tidy left-to-right tree — a section's expanded lessons stack as a VERTICAL COLUMN just
// outward of it, and each lesson's exercises stack as a further column outward again.
//
// Non-overlap is structural, not heuristic. Every node owns a vertical BAND whose height is
// `max(its own row slot, the total height of its children's bands)`, and children are packed
// into disjoint sub-bands inside it. Because each level lives in its own x-column (gaps below
// clear both half-widths) and sibling bands never overlap in y, no two cards can collide —
// on either side — and the two sides are pushed apart on x so they can't collide near the root.

/**
 * Minimum centre-to-centre VERTICAL spacing per level (px). Each is the card height plus a
 * clear margin, so stacked siblings always leave a visible gap:
 *   module 100 + 52 · lesson 84 + 32 · exercise 64 + 32.
 */
const ROW_GAP: Record<MindMapNodeKind, number> = {
    module: 152,
    lesson: 116,
    exercise: 96,
}

/**
 * Horizontal centre-to-centre distance (px) from a parent out to its child column. Each
 * clears the parent half-width + the child half-width + a gutter, so a card and its child
 * column never share x-space (root 120 → module 140 · module 140 → lesson 120 · lesson 120 → exercise 110).
 */
const COL_GAP: Record<MindMapNodeKind, number> = {
    module: 360,
    lesson: 340,
    exercise: 300,
}

/** Cumulative x-offset (from the root) of each level's column — a card sits at `sign · COLUMN_X[kind]`. */
const COLUMN_X: Record<MindMapNodeKind, number> = {
    module: COL_GAP.module,
    lesson: COL_GAP.module + COL_GAP.lesson,
    exercise: COL_GAP.module + COL_GAP.lesson + COL_GAP.exercise,
}

/** Vertical band a LESSON needs: its own row slot, or its exercise column if that is taller. */
const lessonBandHeight = (lesson: LearnLesson): number =>
    Math.max(ROW_GAP.lesson, lesson.exercises.length * ROW_GAP.exercise)

/** Vertical band a MODULE needs: its own row slot when collapsed, else its stacked lessons' total. */
const moduleBandHeight = (module: LearnModule, isExpanded: boolean): number =>
    isExpanded
        ? Math.max(ROW_GAP.module, module.lessons.reduce((sum, lesson) => sum + lessonBandHeight(lesson), 0))
        : ROW_GAP.module

/** Stable node id for a nested exercise (namespaced by its lesson to stay unique). */
const exerciseNodeId = (lessonId: string, exerciseId: string, kind: string): string =>
    `x:${lessonId}:${kind}:${exerciseId}`

/**
 * Edge style shared by every tree link (accent stroke; the current path is emphasised).
 * Stroke sits slightly thicker than a hairline so the CURVE reads clearly, while the
 * muted opacity keeps the connectors quiet behind the cards.
 */
const edgeStyle = (isCurrent: boolean) => ({
    stroke: "var(--accent)",
    strokeWidth: isCurrent ? 2.75 : 1.75,
    opacity: isCurrent ? 1 : 0.5,
})

/**
 * Builds a two-sided horizontal mind map of the course: the SUBJECT-CODE root at the
 * centre, section cards branching to the LEFT and RIGHT (balanced, alternating by order),
 * and — for the sections the viewer has EXPANDED — their lesson cards stacked as a VERTICAL
 * COLUMN just outward of the section, and each lesson's exercise cards stacked as a further
 * column outward again. Sections start collapsed (progressive disclosure): the first paint
 * shows the section cards alone.
 *
 * The layout is a tidy left-to-right tree per side, so cards NEVER overlap by construction:
 * every node owns a vertical band `max(its own row slot, the height of its children's bands)`,
 * children are packed into disjoint sub-bands, each level lives in its own x-column (the
 * COL_GAP clears both half-widths), and the two sides are pushed apart on x. Node states come
 * straight from the per-viewer completion signals on the learn tree
 * ({@link moduleStatus}/{@link lessonStatus}/{@link exerciseStatus}).
 */
export const buildMindMap = ({
    subjectCode,
    completionPercent,
    modules,
    currentLessonId,
    currentModuleId,
    recommendedLessonId = null,
    expandedModuleIds,
}: BuildMindMapInput): MindMapGraph => {
    const nodes: Array<Node<MindMapNodeData>> = []
    const edges: Array<Edge> = []

    const rootId = "root"
    /** Push a node placed by its CENTRE (converted to React Flow's top-left origin). */
    const placeNode = (
        id: string,
        kind: "root" | MindMapNodeKind,
        center: { x: number; y: number },
        data: MindMapNodeData,
    ) => {
        const size = NODE_SIZE[kind]
        nodes.push({
            id,
            type: kind === "root" ? ROOT_NODE_TYPE : CONTENT_NODE_TYPE,
            position: { x: center.x - size.w / 2, y: center.y - size.h / 2 },
            data,
        })
    }
    /**
     * Parent→child connector, drawn as a smooth bezier by the custom {@link CURVED_EDGE_TYPE}
     * edge. The `sign` (branch side: +1 right / −1 left) picks the handle PAIR so the link
     * leaves the parent on its OUTWARD side and enters the child on its INWARD side — a
     * right-branch spoke runs parent-RIGHT → child-LEFT, a left-branch spoke parent-LEFT →
     * child-RIGHT. That keeps every connector flush to the card edge and the whole tree tidy.
     */
    const link = (id: string, source: string, target: string, isCurrent: boolean, sign: number) => {
        const rightBranch = sign >= 0
        edges.push({
            id,
            source,
            target,
            sourceHandle: rightBranch ? "sr" : "sl",
            targetHandle: rightBranch ? "tl" : "tr",
            type: CURVED_EDGE_TYPE,
            animated: isCurrent,
            style: edgeStyle(isCurrent),
        })
    }

    /**
     * Places one lesson (and its exercise sub-column) inside the vertical band
     * `[bandTop, bandTop + bandHeight]` on the given side (`sign` = +1 right / −1 left).
     * The lesson sits at the band's vertical centre; its exercises are packed into a
     * further-out column, centred within the same band, so nothing overlaps.
     */
    const placeLesson = (
        module: LearnModule,
        lesson: LearnLesson,
        sign: number,
        bandTop: number,
        bandHeight: number,
    ) => {
        const lessonNodeId = `l:${lesson.id}`
        const lessonIsCurrent = lesson.id === currentLessonId
        placeNode(lessonNodeId, "lesson", { x: sign * COLUMN_X.lesson, y: bandTop + bandHeight / 2 }, {
            kind: "lesson",
            label: lesson.title,
            description: lesson.description,
            status: lessonStatus(lesson),
            isLocked: lesson.isLocked,
            isCurrent: lessonIsCurrent,
            isRecommended: recommendedLessonId != null && lesson.id === recommendedLessonId,
            moduleId: module.id,
            lessonId: lesson.id,
        })
        link(`e:${module.id}:${lessonNodeId}`, `m:${module.id}`, lessonNodeId, lessonIsCurrent, sign)

        const exerciseCount = lesson.exercises.length
        if (exerciseCount === 0) {
            return
        }
        // Exercises stack as a column outward of the lesson, centred in the lesson's band.
        const exColHeight = exerciseCount * ROW_GAP.exercise
        let exCursor = bandTop + (bandHeight - exColHeight) / 2
        lesson.exercises.forEach((exercise) => {
            const exId = exerciseNodeId(lesson.id, exercise.id, exercise.kind)
            placeNode(exId, "exercise", { x: sign * COLUMN_X.exercise, y: exCursor + ROW_GAP.exercise / 2 }, {
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
            link(`e:${lesson.id}:${exId}`, lessonNodeId, exId, false, sign)
            exCursor += ROW_GAP.exercise
        })
    }

    /**
     * Places one section (and, when expanded, its lesson column) inside its vertical band on
     * the given side. The section card sits at the band's vertical centre; its lessons are
     * packed into disjoint sub-bands, centred within this band.
     */
    const placeModule = (module: LearnModule, sign: number, bandTop: number, bandHeight: number) => {
        const moduleIsCurrent = module.id === currentModuleId
        const isExpanded = expandedModuleIds.has(module.id)
        const moduleNodeId = `m:${module.id}`
        placeNode(moduleNodeId, "module", { x: sign * COLUMN_X.module, y: bandTop + bandHeight / 2 }, {
            kind: "module",
            label: `${module.order}. ${module.title}`,
            description: module.description,
            status: moduleStatus(module),
            isLocked: isModuleLocked(module),
            isCurrent: moduleIsCurrent,
            isExpanded,
            hasChildren: module.lessons.length > 0,
            moduleId: module.id,
            lessonsRead: module.lessons.filter((lesson) => lesson.isCompleted).length,
            lessonsTotal: module.lessons.length,
        })
        link(`e:${rootId}:${moduleNodeId}`, rootId, moduleNodeId, moduleIsCurrent, sign)

        // Progressive disclosure: only an EXPANDED section emits its lessons + exercises.
        if (!isExpanded) {
            return
        }
        const lessonsTotal = module.lessons.reduce((sum, lesson) => sum + lessonBandHeight(lesson), 0)
        let lessonCursor = bandTop + (bandHeight - lessonsTotal) / 2
        module.lessons.forEach((lesson) => {
            const lessonBand = lessonBandHeight(lesson)
            placeLesson(module, lesson, sign, lessonCursor, lessonBand)
            lessonCursor += lessonBand
        })
    }

    /**
     * Stacks one side's sections into a vertical run centred on the root's y (0). Each
     * section owns a band tall enough for its (possibly expanded) subtree, and the bands are
     * laid end-to-end so no two sections — or their lesson columns — ever overlap in y.
     */
    const placeSide = (sideModules: Array<LearnModule>, sign: number) => {
        const bands = sideModules.map((module) => moduleBandHeight(module, expandedModuleIds.has(module.id)))
        const sideHeight = bands.reduce((sum, height) => sum + height, 0)
        let cursor = -sideHeight / 2
        sideModules.forEach((module, index) => {
            placeModule(module, sign, cursor, bands[index])
            cursor += bands[index]
        })
    }

    // Balanced two-sided branching: sections alternate RIGHT / LEFT by order so both columns
    // stay a similar length (a classic balanced mind map), each side stacked vertically.
    placeSide(modules.filter((_module, index) => index % 2 === 0), 1)
    placeSide(modules.filter((_module, index) => index % 2 === 1), -1)

    // The root sits at the centre, between the two branches.
    placeNode(rootId, "root", { x: 0, y: 0 }, {
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
