import { Edge, Node } from "@xyflow/react"
import {
    COURSE_ROOT_NODE_TYPE,
    ROOT_HANDLE_LEFT,
    ROOT_HANDLE_RIGHT,
} from "./RootNode"
import { COURSE_MODULE_NODE_TYPE } from "./ModuleNode"
import { EMPTY_MIND_MAP_PROGRESS, type MindMapProgress } from "./progress"
import type { CourseEntity } from "@/modules/types/entities/course"

/** Resolved UI theme used for mind-map edge / node contrast. */
export type MindMapThemeMode = "light" | "dark"

const ROOT_ID = "course-root"

/**
 * Distance between module card **centers** on the Y axis (px).
 * With `CARD_MIN_HEIGHT` 100, this yields a small visible gap between stacked cards.
 */
const VERTICAL_GAP = 128

/**
 * Horizontal distance from graph origin (root center) to each module column **center** (px).
 * Same magnitude left/right so the mind map stays symmetric.
 */
const HORIZONTAL_DISTANCE = 420

/** Card width shared by root + module nodes (`RootNode` / `ModuleNode`). */
const CARD_WIDTH = 300

/** Minimum card height used for layout math (`min-h` on nodes). */
const CARD_MIN_HEIGHT = 100

const CARD_HALF_WIDTH = CARD_WIDTH / 2
const CARD_HALF_HEIGHT = CARD_MIN_HEIGHT / 2

/**
 * The mind graph.
 */
export interface MindGraph {
    /** The nodes of the mind graph. */
    nodes: Array<Node>
    /** The edges of the mind graph. */
    edges: Array<Edge>
}

/**
 * The mind graph builder.
 */
export interface BuildParams {
    /** The course entity. */
    course: CourseEntity | undefined
    /** The active module id. */
    activeModuleId: string | undefined
    /** Resolved UI theme for edge contrast. */
    themeMode?: MindMapThemeMode
    /**
     * Viewer progress overlay (per-module status, read lessons, current module,
     * completion percent). Defaults to the empty overlay so the graph renders as a
     * structure-only map for guests / the public standalone route.
     */
    progress?: MindMapProgress
}

/**
 * Builds a left/right column mind graph: custom root + module cards, Bezier edges (solid stroke).
 * Module nodes are tinted by the viewer's {@link MindMapProgress} (done / in-progress / not-started),
 * the module owning the next content task is flagged as the current "you are here" node, and the
 * edge to it is emphasised to draw the path from the course root.
 */
export const build = ({
    course,
    activeModuleId,
    themeMode = "light",
    progress = EMPTY_MIND_MAP_PROGRESS,
}: BuildParams): MindGraph => {
    const rootNodeId = course?.id ? `root-${course.id}` : ROOT_ID
    const title = course?.title?.trim() || ""
    const isDark = themeMode === "dark"

    if (!course?.modules?.length) {
        return {
            nodes: [
                {
                    id: rootNodeId,
                    type: COURSE_ROOT_NODE_TYPE,
                    position: { x: -CARD_HALF_WIDTH, y: -CARD_HALF_HEIGHT },
                    data: { label: title || "—", minimal: true },
                    draggable: false,
                    selectable: false,
                },
            ],
            edges: [],
        }
    }

    const sorted = [...course.modules].sort((a, b) => a.sortIndex - b.sortIndex)

    // Place root so its geometric center is at (0, 0) — keeps left/right columns visually balanced.
    const rootNode: Node = {
        id: rootNodeId,
        type: COURSE_ROOT_NODE_TYPE,
        position: { x: -CARD_HALF_WIDTH, y: -CARD_HALF_HEIGHT },
        data: { label: title, completionPercent: progress.completionPercent },
        // positions are locked — the layout is computed, never user-moved
        draggable: false,
        selectable: false,
    }

    const numModules = sorted.length
    const numLeftModules = Math.ceil(numModules / 2)

    const moduleNodes: Array<Node> = sorted.map((module, index) => {
        const isLeft = index < numLeftModules
        // Module center X at ±HORIZONTAL_DISTANCE; top-left = center minus half card width (symmetric both sides).
        const centerX = isLeft ? -HORIZONTAL_DISTANCE : HORIZONTAL_DISTANCE
        const x = centerX - CARD_HALF_WIDTH

        const countInSide = isLeft ? numLeftModules : numModules - numLeftModules
        const indexInSide = isLeft ? index : index - numLeftModules
        // Stack column around y = 0 (same center as root).
        const centerY = (indexInSide - (countInSide - 1) / 2) * VERTICAL_GAP
        const y = centerY - CARD_HALF_HEIGHT

        const isActive = Boolean(activeModuleId && module.id === activeModuleId)
        const isCurrent = module.id === progress.currentModuleId
        const moduleProgress = progress.byModuleId.get(module.id)

        // real lessons of this module (ordered) — expanded on click as child cards,
        // each carrying the viewer's read flag so the expanded card can show it.
        const contents = [...(module.contents ?? [])]
            .sort((prev, next) => prev.sortIndex - next.sortIndex)
            .map((content) => ({
                id: content.id,
                title: `${content.sortIndex}. ${content.title}`,
                isRead: progress.readLessonIds.has(content.id),
            }))

        return {
            id: module.id,
            type: COURSE_MODULE_NODE_TYPE,
            position: { x, y },
            data: {
                label: `${module.sortIndex}. ${module.title}`,
                isLeft,
                isActive,
                isCurrent,
                status: moduleProgress?.status ?? "notStarted",
                lessonsRead: moduleProgress?.lessonsRead ?? 0,
                lessonsTotal: moduleProgress?.lessonsTotal ?? (module.contents?.length ?? 0),
                isLocked: moduleProgress?.isLocked ?? false,
                hasProgress: Boolean(moduleProgress),
                moduleId: module.id,
                courseDisplayId: course.displayId,
                contents,
            },
            draggable: false,
            selectable: true,
        }
    })

    const edges: Array<Edge> = sorted.map((module, index) => {
        const isLeft = index < numLeftModules
        // emphasise the path from the root to the "you are here" module
        const isCurrent = module.id === progress.currentModuleId
        return {
            id: `e-${rootNodeId}-${module.id}`,
            source: rootNodeId,
            sourceHandle: isLeft ? ROOT_HANDLE_LEFT : ROOT_HANDLE_RIGHT,
            target: module.id,
            type: "default",
            animated: isCurrent,
            style: {
                stroke: "var(--accent)",
                strokeWidth: isCurrent ? 3 : 2,
                opacity: isCurrent ? 1 : isDark ? 0.55 : 0.45,
            },
        }
    })

    return {
        nodes: [rootNode, ...moduleNodes],
        edges,
    }
}
