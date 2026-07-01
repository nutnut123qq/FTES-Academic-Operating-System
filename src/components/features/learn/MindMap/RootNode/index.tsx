"use client"

import React from "react"
import { Handle, type Node, type NodeProps, Position } from "@xyflow/react"
import { cn } from "@heroui/react"

/** React Flow node type id for the course root (two side source handles). */
export const COURSE_ROOT_NODE_TYPE = "courseRoot" as const

/** Handle id: edges to left-column modules attach here. */
export const ROOT_HANDLE_LEFT = "root-left" as const

/** Handle id: edges to right-column modules attach here. */
export const ROOT_HANDLE_RIGHT = "root-right" as const

export type CourseRootNodeData = {
    /** Course title shown in the card. */
    label: string
    /** When true, use compact typography (e.g. no modules placeholder). */
    minimal?: boolean
    /** Overall course completion percent (0-100); omitted for guests / standalone. */
    completionPercent?: number
}

export type CourseRootFlowNode = Node<CourseRootNodeData, typeof COURSE_ROOT_NODE_TYPE>

/** Diameter / stroke of the completion ring (px). */
const RING_SIZE = 72
const RING_STROKE = 6
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS

/**
 * Single overall-completion ring drawn inside the course root: an accent arc over a
 * track, the rounded percent in the centre. This is the ONE total progress meter on
 * the map (per-module nodes show a count, not a bar).
 * @param percent — Completion percent, 0-100.
 */
const CompletionRing = ({ percent }: { percent: number }) => {
    const clamped = Math.max(0, Math.min(100, percent))
    const offset = RING_CIRCUMFERENCE * (1 - clamped / 100)
    return (
        <div className="relative" style={{ width: RING_SIZE, height: RING_SIZE }}>
            <svg width={RING_SIZE} height={RING_SIZE} className="-rotate-90" aria-hidden focusable="false">
                <circle
                    cx={RING_SIZE / 2}
                    cy={RING_SIZE / 2}
                    r={RING_RADIUS}
                    fill="none"
                    stroke="var(--separator)"
                    strokeWidth={RING_STROKE}
                />
                <circle
                    cx={RING_SIZE / 2}
                    cy={RING_SIZE / 2}
                    r={RING_RADIUS}
                    fill="none"
                    stroke="var(--accent)"
                    strokeWidth={RING_STROKE}
                    strokeLinecap="round"
                    strokeDasharray={RING_CIRCUMFERENCE}
                    strokeDashoffset={offset}
                />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-base font-semibold text-foreground">
                {`${Math.round(clamped)}%`}
            </div>
        </div>
    )
}

/**
 * Custom root node with left/right source handles so edges can split like a mind map.
 * Shows the overall completion ring when the viewer's progress is known.
 * @param props — React Flow `NodeProps` for `courseRoot` nodes.
 */
export const CourseRootNode = (props: NodeProps<CourseRootFlowNode>) => {
    const { data, selected } = props
    const minimal = Boolean(data.minimal)
    const hasProgress = typeof data.completionPercent === "number"

    return (
        <div
            className={cn(
                "relative flex min-h-[100px] min-w-[300px] w-[300px] flex-col items-center justify-center gap-3 rounded-3xl px-4 py-3 text-center",
                "card card--default",
                "dark:!border-zinc-600/90 dark:!bg-zinc-900/95 dark:!shadow-lg dark:!shadow-black/40",
                minimal
                    ? "text-2xl font-semibold !border-none !shadow-none dark:!border dark:!border-zinc-600 dark:!bg-zinc-900/90"
                    : "!text-xl",
                selected && "ring-2 ring-accent/40 dark:ring-accent/50",
            )}
        >
            <Handle
                id={ROOT_HANDLE_LEFT}
                isConnectable={false}
                className="!h-px !w-px !min-h-0 !min-w-0 !border-0 !bg-transparent !opacity-0"
                position={Position.Left}
                type="source"
            />
            {hasProgress ? <CompletionRing percent={data.completionPercent as number} /> : null}
            <div
                className={cn(
                    "max-w-full truncate font-semibold text-foreground",
                    minimal ? "text-2xl" : "text-xl",
                )}
            >
                {data.label}
            </div>
            <Handle
                id={ROOT_HANDLE_RIGHT}
                isConnectable={false}
                className="!h-px !w-px !min-h-0 !min-w-0 !border-0 !bg-transparent !opacity-0"
                position={Position.Right}
                type="source"
            />
        </div>
    )
}
