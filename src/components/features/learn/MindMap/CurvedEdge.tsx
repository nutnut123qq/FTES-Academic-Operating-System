"use client"

import React, { memo } from "react"
import { BaseEdge, type EdgeProps } from "@xyflow/react"

/** React Flow edge type id for a curved mind-map connector. */
export const CURVED_EDGE_TYPE = "mindMapCurved" as const

/**
 * How far the two cubic control points slide toward the middle of the spoke's DOMINANT
 * axis, as a fraction of that axis' span. `0.5` puts both control points at the mid-span
 * (the classic React-Flow "flowing bezier" S), so the curve leaves the source and enters
 * the target parallel to that axis — a gentle sideways sweep, not a sharp elbow.
 */
const CURVE_TENSION = 0.5

/**
 * Builds a CUBIC-bezier path that flows smoothly from the source centre to the target
 * centre. The curve is oriented along the spoke's DOMINANT axis (the larger of |dx|/|dy|):
 * a mostly-sideways spoke (a left/right branch) leaves and enters its nodes HORIZONTALLY,
 * a mostly-vertical spoke does so vertically. Both control points sit at the mid-point of
 * that axis, each held at its OWN endpoint's cross-axis value — the standard smoothstep /
 * bezier "flowing curve":
 *
 *   horizontal:  C  (sx + dx·t, sy)   (tx − dx·t, ty)
 *   vertical:    C  (sx, sy + dy·t)   (tx, ty − dy·t)
 *
 * The offset SIGN comes straight from the geometry (`dx`/`dy`), so a right-branch edge
 * curves rightward and a left-branch edge curves leftward, each entering its node smoothly
 * — no fixed rotational bow (which read as a uniform pinwheel). We build the path by hand
 * rather than using React Flow's `getBezierPath` because our handles all sit at the node
 * CENTRE with no `Position` directionality, so the built-in bezier would render near-flat.
 */
export const curvedEdgePath = (
    sourceX: number,
    sourceY: number,
    targetX: number,
    targetY: number,
): string => {
    const dx = targetX - sourceX
    const dy = targetY - sourceY
    // Orient along the spoke's dominant axis (left/right branches are horizontal-dominant).
    const horizontal = Math.abs(dx) >= Math.abs(dy)
    const control1X = horizontal ? sourceX + dx * CURVE_TENSION : sourceX
    const control1Y = horizontal ? sourceY : sourceY + dy * CURVE_TENSION
    const control2X = horizontal ? targetX - dx * CURVE_TENSION : targetX
    const control2Y = horizontal ? targetY : targetY - dy * CURVE_TENSION
    return `M ${sourceX},${sourceY} C ${control1X},${control1Y} ${control2X},${control2Y} ${targetX},${targetY}`
}

/**
 * Custom curved connector for the mind map. Draws a smooth cubic bezier from the source
 * node's centre to the target's centre via {@link curvedEdgePath}, flowing along the
 * branch's dominant (left/right) axis. The endpoints stay at the node centres (hidden
 * under the cards); only the flowing arc between two cards is visible. Styling (muted
 * stroke, emphasised current path, `animated` dash) is carried on the edge object and
 * flows straight through to the underlying path.
 */
const MindMapCurvedEdgeBase = ({
    sourceX,
    sourceY,
    targetX,
    targetY,
    markerEnd,
    style,
}: EdgeProps) => (
    <BaseEdge path={curvedEdgePath(sourceX, sourceY, targetX, targetY)} markerEnd={markerEnd} style={style} />
)

export const MindMapCurvedEdge = memo(MindMapCurvedEdgeBase)
