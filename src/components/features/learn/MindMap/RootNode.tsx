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
 * Custom course-root node: shows the FULL COURSE TITLE (e.g. "MAE101 - Toán Cao Cấp Cho
 * Lập Trình") over the overall completion ring — no acronym, since an abbreviation reads
 * as noise ("M-TCCC"). A long title WRAPS over up to 3 lines and is clamped there; the
 * box is fixed at `w-[300px] min-h-[200px]`, which is exactly `NODE_SIZE.root` in
 * `build.ts`, so the layout's gap maths still matches what is painted.
 *
 * A source handle on EACH side (left + right) lets the tree branch out to the sections on
 * both sides: a right-branch section links from the root's RIGHT handle, a left-branch one
 * from its LEFT — so each connector leaves the root flush on the side it heads toward.
 */
const MindMapRootNodeBase = ({ data }: NodeProps) => {
    const { label, completionPercent } = data as MindMapNodeData
    return (
        <div className="flex min-h-[200px] w-[300px] flex-col items-center justify-center gap-3 rounded-3xl border border-separator bg-surface px-4 py-4 text-center shadow-sm">
            {typeof completionPercent === "number" ? (
                <CompletionRing percent={completionPercent} />
            ) : null}
            <div
                className="line-clamp-3 max-w-full break-words text-lg font-bold leading-snug text-foreground"
                title={label}
            >
                {label}
            </div>
            <Handle
                type="source"
                position={Position.Left}
                id="sl"
                isConnectable={false}
                className="!size-2 !min-h-0 !min-w-0 !border-0 !bg-transparent !opacity-0"
            />
            <Handle
                type="source"
                position={Position.Right}
                id="sr"
                isConnectable={false}
                className="!size-2 !min-h-0 !min-w-0 !border-0 !bg-transparent !opacity-0"
            />
        </div>
    )
}

export const MindMapRootNode = memo(MindMapRootNodeBase)
