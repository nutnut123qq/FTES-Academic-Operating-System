"use client"

import React, { memo } from "react"
import { BaseEdge, type EdgeProps, getBezierPath } from "@xyflow/react"

/** React Flow edge type id for a curved mind-map connector. */
export const CURVED_EDGE_TYPE = "mindMapCurved" as const

/**
 * How far the two cubic control points slide toward the middle of the spoke's DOMINANT
 * axis, as a fraction of that axis' span. `0.5` puts both control points at the mid-span
 * (the classic "flowing bezier" S). Retained as a tested pure helper (see
 * `MindMap/index.test.tsx`); the live edge below draws with React Flow's own
 * {@link getBezierPath}, anchored on the nodes' SIDE handles.
 */
const CURVE_TENSION = 0.5

/**
 * Builds a CUBIC-bezier path from source to target oriented along the spoke's DOMINANT axis
 * (the larger of |dx|/|dy|). Kept for unit tests; the rendered edge uses
 * {@link getBezierPath} with the connected handles' `Position`.
 */
export const curvedEdgePath = (
    sourceX: number,
    sourceY: number,
    targetX: number,
    targetY: number,
): string => {
    const dx = targetX - sourceX
    const dy = targetY - sourceY
    const horizontal = Math.abs(dx) >= Math.abs(dy)
    const control1X = horizontal ? sourceX + dx * CURVE_TENSION : sourceX
    const control1Y = horizontal ? sourceY : sourceY + dy * CURVE_TENSION
    const control2X = horizontal ? targetX - dx * CURVE_TENSION : targetX
    const control2Y = horizontal ? targetY : targetY - dy * CURVE_TENSION
    return `M ${sourceX},${sourceY} C ${control1X},${control1Y} ${control2X},${control2Y} ${targetX},${targetY}`
}

/**
 * Custom curved connector for the mind map. Its endpoints come from each card's SIDE handle
 * (a right-branch link runs parent-RIGHT → child-LEFT, a left-branch link parent-LEFT →
 * child-RIGHT — chosen in `buildMindMap`), so React Flow supplies `sourcePosition` /
 * `targetPosition` and {@link getBezierPath} draws a smooth S that LEAVES and ENTERS each
 * card horizontally, flush on its side edge — never piercing the card, never falling short
 * of it. Styling (muted stroke, emphasised current path, `animated` dash) rides on the edge
 * object straight through to the path.
 */
const MindMapCurvedEdgeBase = ({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    markerEnd,
    style,
}: EdgeProps) => {
    const [path] = getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
    })
    return <BaseEdge path={path} markerEnd={markerEnd} style={style} />
}

export const MindMapCurvedEdge = memo(MindMapCurvedEdgeBase)
