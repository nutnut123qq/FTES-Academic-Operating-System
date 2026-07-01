"use client"

import React, { useCallback } from "react"
import { Handle, type Edge, type Node, type NodeProps, Position, useReactFlow, useStore } from "@xyflow/react"
import { cn } from "@heroui/react"
import { useTranslations } from "next-intl"
import { CheckCircleIcon, LockIcon } from "@phosphor-icons/react"

import {
    CONTENT_OUTWARD_GAP,
    COURSE_MODULE_SLOT_NODE_TYPE,
    MODULE_CARD_BODY_HEIGHT,
    MODULE_CARD_WIDTH,
    MODULE_CHILD_SOURCE_HANDLE,
    MODULE_CONTENT_PREFIX,
    SLOT_NODE_HEIGHT,
    SLOT_NODE_WIDTH,
    SLOT_VERTICAL_STEP,
    moduleContentNodeId,
} from "../moduleExpansion"
import type { MindMapModuleStatus } from "../progress"

/** React Flow node type id for course modules (card + invisible handles). */
export const COURSE_MODULE_NODE_TYPE = "courseModule" as const

/** One lesson summary carried on a module node for on-click expansion. */
export type CourseModuleContentItem = {
    /** Lesson (content) id. */
    id: string
    /** Lesson label (order + title). */
    title: string
    /** Whether the viewer has read this lesson (drives the expanded card check). */
    isRead: boolean
}

export type CourseModuleNodeData = {
    /** Module title line (order + title). */
    label: string
    /** True when this module sits in the left column (target handle on the right). */
    isLeft: boolean
    /** Whether this module is the active selection in Redux. */
    isActive: boolean
    /** Whether this module owns the viewer's next content task ("you are here"). */
    isCurrent: boolean
    /** Coarse completion state of this module (tints the card). */
    status: MindMapModuleStatus
    /** Lessons the viewer has read in this module. */
    lessonsRead: number
    /** Total lessons in this module. */
    lessonsTotal: number
    /** Whether the whole module sits behind the premium paywall. */
    isLocked: boolean
    /** Whether a progress overlay is known (false → structure-only / guest). */
    hasProgress: boolean
    /** This module's id (parent for the expanded lesson cards). */
    moduleId: string
    /** Course mount slug — threaded onto lesson cards for URL building. */
    courseDisplayId: string
    /** Real lessons of this module, expanded as child cards on click. */
    contents: Array<CourseModuleContentItem>
}

/** Card tint per completion status (token-based, dark-mode safe). */
const STATUS_TINT: Record<MindMapModuleStatus, string> = {
    done: "bg-success/10 border-success/40",
    inProgress: "bg-warning/10 border-warning/40",
    notStarted: "bg-surface border-separator",
}

export type CourseModuleFlowNode = Node<CourseModuleNodeData, typeof COURSE_MODULE_NODE_TYPE>

/**
 * Module node: click to reveal this module's real lessons as cards in the outer column.
 * Accordion — opening one module collapses any other module's expanded lessons.
 * @param props — React Flow `NodeProps` for `courseModule` nodes.
 */
export const CourseModuleNode = (props: NodeProps<CourseModuleFlowNode>) => {
    const { id, data, selected } = props
    const t = useTranslations()
    const { getNode, setNodes, setEdges } = useReactFlow()

    /** This module's lesson-card id prefix — used to detect/strip its expanded nodes. */
    const contentPrefix = `${id}${MODULE_CONTENT_PREFIX}`

    // true when this module currently has its lessons expanded
    const expanded = useStore(
        useCallback(
            (state) => state.nodes.some((node) => node.id.startsWith(contentPrefix)),
            [contentPrefix],
        ),
    )

    const toggleContents = useCallback(() => {
        const self = getNode(id)
        if (!self) {
            return
        }

        // already open → collapse just this module's lessons
        if (getNode(moduleContentNodeId(id, data.contents[0]?.id ?? ""))) {
            setNodes((nodes) => nodes.filter((node) => !node.id.startsWith(contentPrefix)))
            setEdges((edges) => edges.filter((edge) => !edge.target.startsWith(contentPrefix)))
            return
        }

        if (data.contents.length === 0) {
            return
        }

        // lessons sit in the empty outer column (left module → further left, right → further right)
        const outerX = data.isLeft
            ? self.position.x - CONTENT_OUTWARD_GAP - SLOT_NODE_WIDTH
            : self.position.x + MODULE_CARD_WIDTH + CONTENT_OUTWARD_GAP
        // stack the lessons vertically centered on the module's center
        const moduleCenterY = self.position.y + MODULE_CARD_BODY_HEIGHT / 2
        const count = data.contents.length

        const contentNodes: Array<Node> = data.contents.map((content, index) => {
            const centerY = moduleCenterY + (index - (count - 1) / 2) * SLOT_VERTICAL_STEP
            return {
                id: moduleContentNodeId(id, content.id),
                type: COURSE_MODULE_SLOT_NODE_TYPE,
                position: { x: outerX, y: centerY - SLOT_NODE_HEIGHT / 2 },
                data: {
                    parentModuleId: id,
                    courseDisplayId: data.courseDisplayId,
                    moduleId: data.moduleId,
                    contentId: content.id,
                    label: content.title,
                    isLeft: data.isLeft,
                    isRead: content.isRead,
                },
                draggable: false,
                selectable: false,
            }
        })

        const contentEdges: Array<Edge> = data.contents.map((content) => ({
            id: `e-${moduleContentNodeId(id, content.id)}`,
            source: id,
            sourceHandle: MODULE_CHILD_SOURCE_HANDLE,
            target: moduleContentNodeId(id, content.id),
            type: "default",
            animated: false,
            style: {
                stroke: "var(--accent)",
                strokeWidth: 1.5,
                opacity: 0.85,
            },
        }))

        // accordion: drop every module's lesson nodes/edges, then add this module's
        setNodes((nodes) => [
            ...nodes.filter((node) => node.type !== COURSE_MODULE_SLOT_NODE_TYPE),
            ...contentNodes,
        ])
        setEdges((edges) => [
            ...edges.filter((edge) => !edge.target.includes(MODULE_CONTENT_PREFIX)),
            ...contentEdges,
        ])
    }, [getNode, id, data, contentPrefix, setEdges, setNodes])

    const onToggleKeyDown = useCallback(
        (event: React.KeyboardEvent<HTMLButtonElement>) => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault()
                toggleContents()
            }
        },
        [toggleContents],
    )

    return (
        <div
            className={cn(
                "relative flex min-h-[100px] min-w-[300px] w-[300px] flex-col items-stretch rounded-3xl px-4 py-3 text-center",
                "border shadow-sm transition-all duration-200 dark:shadow-lg dark:shadow-black/30",
                STATUS_TINT[data.status],
                "hover:border-accent hover:shadow-md hover:ring-2 hover:ring-accent/30 dark:hover:ring-accent/40",
                data.isActive && "border-accent ring-2 ring-accent/35 dark:ring-accent/45",
                // "you are here" — strongest emphasis, wins over status border
                data.isCurrent && "border-accent ring-2 ring-accent/50 dark:ring-accent/60",
                selected && "ring-2 ring-accent/25 dark:ring-accent/35",
            )}
        >
            <Handle
                isConnectable={false}
                className="!h-px !w-px !min-h-0 !min-w-0 !border-0 !bg-transparent !opacity-0"
                position={data.isLeft ? Position.Right : Position.Left}
                type="target"
            />
            <Handle
                id={MODULE_CHILD_SOURCE_HANDLE}
                isConnectable={false}
                className="!h-px !w-px !min-h-0 !min-w-0 !border-0 !bg-transparent !opacity-0"
                position={data.isLeft ? Position.Left : Position.Right}
                type="source"
            />
            <button
                type="button"
                aria-expanded={expanded}
                aria-label={t("content.mindMapModuleToggleAria")}
                className={cn(
                    "nodrag nopan flex min-h-0 flex-1 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl px-1 py-2 text-center outline-none",
                    "focus-visible:ring-2 focus-visible:ring-accent/40",
                )}
                onClick={() => {
                    // toggle lessons; the click also bubbles to ReactFlow `onNodeClick` to zoom-to-center
                    toggleContents()
                }}
                onKeyDown={onToggleKeyDown}
            >
                <div className="max-w-full text-pretty text-sm font-semibold leading-snug text-foreground">
                    {data.label}
                </div>
                {/* meta row: lock · done · lessons read count · "you are here" — light, one line */}
                <div className="flex flex-wrap items-center justify-center gap-2 text-xs leading-none text-muted">
                    {data.isLocked ? (
                        <LockIcon aria-label={t("mindMap.legend.locked")} focusable="false" className="size-4" />
                    ) : null}
                    {data.status === "done" ? (
                        <CheckCircleIcon aria-label={t("mindMap.legend.done")} focusable="false" className="size-4 text-success" />
                    ) : null}
                    {data.hasProgress && data.lessonsTotal > 0 ? (
                        <span>
                            {t("mindMap.moduleLessons", { read: data.lessonsRead, total: data.lessonsTotal })}
                        </span>
                    ) : null}
                    {data.isCurrent ? (
                        <span className="font-medium text-accent">{t("mindMap.legend.current")}</span>
                    ) : null}
                </div>
            </button>
        </div>
    )
}
