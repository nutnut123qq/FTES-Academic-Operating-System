"use client"

import React, { memo } from "react"
import { Handle, type NodeProps, Position } from "@xyflow/react"
import type { MindMapNodeData } from "./build"

/** Diameter / stroke of the completion ring (px). */
const RING_SIZE = 76
const RING_STROKE = 6
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS

/**
 * Overall-completion ring drawn inside the course root: an accent arc over a track
 * with the rounded percent in the centre. This is the ONE total-progress meter on
 * the map (content nodes carry a status tint, not a bar).
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
            <div className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-foreground">
                {`${Math.round(clamped)}%`}
            </div>
        </div>
    )
}

/**
 * Custom course-root node: shows the SUBJECT CODE (e.g. "CSD201") — not the long,
 * uneven course title — over the overall completion ring. A single right-side source
 * handle lets the tree fan out to the module column.
 */
const MindMapRootNodeBase = ({ data }: NodeProps) => {
    const { label, completionPercent } = data as MindMapNodeData
    return (
        <div className="flex min-h-[128px] w-[240px] flex-col items-center justify-center gap-3 rounded-3xl border border-separator bg-surface px-4 py-4 text-center shadow-sm">
            {typeof completionPercent === "number" ? (
                <CompletionRing percent={completionPercent} />
            ) : null}
            <div className="max-w-full truncate text-2xl font-bold tracking-wide text-foreground">
                {label}
            </div>
            <Handle
                type="source"
                position={Position.Right}
                isConnectable={false}
                className="!h-px !w-px !min-h-0 !min-w-0 !border-0 !bg-transparent !opacity-0"
            />
        </div>
    )
}

export const MindMapRootNode = memo(MindMapRootNodeBase)
