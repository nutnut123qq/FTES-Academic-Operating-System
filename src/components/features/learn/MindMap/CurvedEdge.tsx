"use client"

import React, { memo } from "react"
import { BaseEdge, type EdgeProps, useInternalNode } from "@xyflow/react"

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
 * The point where the ray from a node's centre `(cx, cy)` toward the OTHER node `(px, py)`
 * crosses this node's bounding-box border (half-extents `halfW`/`halfH`). Used to stop the
 * connector AT the card edge instead of at the hidden centre — otherwise the dashed line
 * pierces into the card body (the centre endpoint is only "hidden" while the card fully
 * paints over it, which the semi-transparent status fills do not). Returns the centre
 * itself while the node is still unmeasured (`halfW`/`halfH` = 0) — the first frame before
 * React Flow measures the DOM — then snaps to the border once dimensions are known.
 */
const borderAnchor = (
    cx: number,
    cy: number,
    halfW: number,
    halfH: number,
    px: number,
    py: number,
): [number, number] => {
    const dx = px - cx
    const dy = py - cy
    if ((halfW === 0 && halfH === 0) || (dx === 0 && dy === 0)) {
        return [cx, cy]
    }
    // Smallest scale along the centre→centre ray that reaches the vertical OR horizontal
    // edge of the box; clamp to 1 so an overlapping pair never overshoots past the centre.
    const scale = Math.min(
        dx !== 0 ? halfW / Math.abs(dx) : Number.POSITIVE_INFINITY,
        dy !== 0 ? halfH / Math.abs(dy) : Number.POSITIVE_INFINITY,
        1,
    )
    return [cx + dx * scale, cy + dy * scale]
}

/**
 * Builds a CUBIC-bezier path that flows smoothly from the source anchor to the target
 * anchor. The curve is oriented along the spoke's DOMINANT axis (the larger of |dx|/|dy|):
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
 * Custom curved connector for the mind map. Its handles sit at each node's CENTRE (no
 * `Position` directionality), so the raw endpoints would land on the hidden centre and the
 * dashed arc would pierce into the target card. Instead each endpoint is snapped to the
 * card's BORDER facing the other node (via {@link borderAnchor}, using the measured node
 * size), so the connector reaches the edge of the box and stops there — exactly at the card
 * outline, never through it. Styling (muted stroke, emphasised current path, `animated`
 * dash) is carried on the edge object and flows straight through to the underlying path.
 */
const MindMapCurvedEdgeBase = ({
    source,
    target,
    sourceX,
    sourceY,
    targetX,
    targetY,
    markerEnd,
    style,
}: EdgeProps) => {
    const sourceNode = useInternalNode(source)
    const targetNode = useInternalNode(target)
    const [sx, sy] = borderAnchor(
        sourceX,
        sourceY,
        (sourceNode?.measured?.width ?? 0) / 2,
        (sourceNode?.measured?.height ?? 0) / 2,
        targetX,
        targetY,
    )
    const [tx, ty] = borderAnchor(
        targetX,
        targetY,
        (targetNode?.measured?.width ?? 0) / 2,
        (targetNode?.measured?.height ?? 0) / 2,
        sourceX,
        sourceY,
    )
    return <BaseEdge path={curvedEdgePath(sx, sy, tx, ty)} markerEnd={markerEnd} style={style} />
}

export const MindMapCurvedEdge = memo(MindMapCurvedEdgeBase)
