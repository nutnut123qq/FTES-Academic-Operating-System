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

/** Approximate node box (px) per level — used to convert a CENTRE to React Flow's top-left origin. */
const NODE_SIZE: Record<"root" | MindMapNodeKind, { w: number; h: number }> = {
    root: { w: 240, h: 128 },
    module: { w: 280, h: 100 },
    lesson: { w: 240, h: 84 },
    exercise: { w: 220, h: 64 },
}

// -------------------------------------------------------------- radial geometry
// The map is a classic radial tree: the subject-code root sits at the origin and
// the sections fan out EVENLY on all sides (angle 2π·i/N), not down one column.
// When a section expands, its lessons fan further out along that branch's outward
// direction (staying inside the section's angular sector so branches never collide),
// and each lesson's exercises fan further out again.

/** Tangential spacing budget per section — grows the ring radius so cards never touch. */
const MODULE_ARC = 360
/** Floor for the section ring radius (keeps a small course off the root). */
const MODULE_RADIUS_MIN = 380
/** Radial distance from a section node out to its lesson ring. */
const LESSON_GAP = 220
/** Radial distance from a lesson out to its exercise ring. */
const EXERCISE_GAP = 180
/** Angular step between adjacent lessons of a section (rad). */
const LESSON_ANGLE_STEP = 0.32
/** Angular step between adjacent exercises of a lesson (rad). */
const EXERCISE_ANGLE_STEP = 0.17

/** Polar → cartesian around the origin (React Flow's +y points down; orientation is irrelevant to a ring). */
const polar = (radius: number, angle: number): { x: number; y: number } => ({
    x: radius * Math.cos(angle),
    y: radius * Math.sin(angle),
})

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
 * Builds a RADIAL tree of the course: the SUBJECT-CODE root at the centre, section
 * cards fanned evenly around it (angle `2π·i/N` at a ring radius that scales with the
 * section count), and — for the sections the viewer has EXPANDED — their lesson cards
 * and exercise cards fanned further outward along each branch. Sections start
 * collapsed (progressive disclosure): the first paint shows the section ring alone.
 *
 * Ported from StarCI's React-Flow `build` (custom node types + edges) and adapted so
 * the map reads as a mind map (distributed on all sides) rather than a one-sided
 * dendrogram. Node states come straight from the per-viewer completion signals on the
 * learn tree ({@link moduleStatus}/{@link lessonStatus}/{@link exerciseStatus}).
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
    /** Straight (centre-to-centre) edge — the classic radial spoke. */
    const link = (id: string, source: string, target: string, isCurrent: boolean) => {
        edges.push({ id, source, target, type: "straight", animated: isCurrent, style: edgeStyle(isCurrent) })
    }

    const moduleCount = modules.length
    // Ring radius scales with the section count so cards never overlap on the ring.
    const moduleRadius = Math.max(MODULE_RADIUS_MIN, (moduleCount * MODULE_ARC) / (2 * Math.PI))
    // Angular slice each section owns — its children stay inside it so branches don't collide.
    const sector = moduleCount > 0 ? (2 * Math.PI) / moduleCount : 2 * Math.PI

    modules.forEach((module, index) => {
        const modLocked = isModuleLocked(module)
        const modStatus = moduleStatus(module)
        const lessonsRead = module.lessons.filter((lesson) => lesson.isCompleted).length
        const moduleIsCurrent = module.id === currentModuleId
        const isExpanded = expandedModuleIds.has(module.id)

        // Start at the top and go around the ring evenly.
        const angle = -Math.PI / 2 + (2 * Math.PI * index) / Math.max(moduleCount, 1)
        const moduleCenter = polar(moduleRadius, angle)
        const moduleNodeId = `m:${module.id}`
        placeNode(moduleNodeId, "module", moduleCenter, {
            kind: "module",
            label: `${module.order}. ${module.title}`,
            description: module.description,
            status: modStatus,
            isLocked: modLocked,
            isCurrent: moduleIsCurrent,
            isExpanded,
            hasChildren: module.lessons.length > 0,
            moduleId: module.id,
            lessonsRead,
            lessonsTotal: module.lessons.length,
        })
        link(`e:${rootId}:${moduleNodeId}`, rootId, moduleNodeId, moduleIsCurrent)

        // Progressive disclosure: only an EXPANDED section emits its lessons + exercises.
        if (!isExpanded) {
            return
        }

        const k = module.lessons.length
        // Fan lessons within the section's sector (narrowed to leave gutters), radius
        // grows with the lesson count so tangential spacing clears the cards.
        const lessonSpread = Math.min(sector * 0.82, Math.max(0, k - 1) * LESSON_ANGLE_STEP)
        const lessonRadius = moduleRadius + LESSON_GAP + Math.max(0, k - 5) * 16
        const perLessonAngle = k > 1 ? lessonSpread / (k - 1) : sector * 0.6

        module.lessons.forEach((lesson, lessonIndex) => {
            const lessonFrac = k === 1 ? 0 : lessonIndex / (k - 1) - 0.5
            const lessonAngle = angle + lessonFrac * lessonSpread
            const lessonCenter = polar(lessonRadius, lessonAngle)
            const lessonNodeId = `l:${lesson.id}`
            const lessonIsCurrent = lesson.id === currentLessonId
            placeNode(lessonNodeId, "lesson", lessonCenter, {
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
            link(`e:${module.id}:${lessonNodeId}`, moduleNodeId, lessonNodeId, lessonIsCurrent)

            const e = lesson.exercises.length
            if (e === 0) {
                return
            }
            // Exercises fan further out, inside the lesson's own sub-slice of the sector.
            const exSpread = Math.min(perLessonAngle * 0.8, Math.max(0, e - 1) * EXERCISE_ANGLE_STEP)
            const exerciseRadius = lessonRadius + EXERCISE_GAP + Math.max(0, e - 3) * 14
            lesson.exercises.forEach((exercise, exIndex) => {
                const exFrac = e === 1 ? 0 : exIndex / (e - 1) - 0.5
                const exAngle = lessonAngle + exFrac * exSpread
                const exCenter = polar(exerciseRadius, exAngle)
                const exId = exerciseNodeId(lesson.id, exercise.id, exercise.kind)
                placeNode(exId, "exercise", exCenter, {
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
                link(`e:${lesson.id}:${exId}`, lessonNodeId, exId, false)
            })
        })
    })

    // The root sits at the centre of the ring.
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
