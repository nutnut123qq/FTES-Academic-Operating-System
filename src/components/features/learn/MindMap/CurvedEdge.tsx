"use client"

import React, { memo } from "react"
import { BaseEdge, type EdgeProps } from "@xyflow/react"

/** React Flow edge type id for a curved mind-map connector. */
export const CURVED_EDGE_TYPE = "mindMapCurved" as const

/** How far the arc bows out from the straight spoke, as a fraction of the spoke length. */
const CURVATURE = 0.22
/** Cap on the bow (px) so long root→section spokes stay gently curved, not ballooned. */
const MAX_BOW = 90

/**
 * Builds a quadratic-bezier path that BOWS the straight centre-to-centre spoke out to
 * one side. The single control point sits at the spoke's midpoint, pushed PERPENDICULAR
 * to the line by `curvature · length` (capped), so every connector reads as a gentle,
 * consistent curve regardless of the radial direction the branch points — unlike a
 * built-in bezier, whose bend depends on the source/target handle `Position` (all our
 * handles sit at the node centre with no directionality, which would render near-flat).
 *
 * A FIXED perpendicular sign bows every edge the same rotational way, giving the radial
 * map a coherent pinwheel curve rather than a mix of left/right bends.
 */
export const curvedEdgePath = (
    sourceX: number,
    sourceY: number,
    targetX: number,
    targetY: number,
): string => {
    const dx = targetX - sourceX
    const dy = targetY - sourceY
    const length = Math.hypot(dx, dy) || 1
    const bow = Math.min(MAX_BOW, length * CURVATURE)
    // Unit perpendicular to the spoke (the travel vector rotated 90°).
    const nx = -dy / length
    const ny = dx / length
    const midX = (sourceX + targetX) / 2
    const midY = (sourceY + targetY) / 2
    const controlX = midX + nx * bow
    const controlY = midY + ny * bow
    return `M ${sourceX},${sourceY} Q ${controlX},${controlY} ${targetX},${targetY}`
}

/**
 * Custom curved connector for the radial mind map. Draws a perpendicular-bow quadratic
 * bezier from the source node's centre to the target's centre via {@link curvedEdgePath}.
 * The endpoints stay at the node centres (hidden under the cards); only the arc between
 * two cards is visible. Styling (muted stroke, emphasised current path, `animated` dash)
 * is carried on the edge object and flows straight through to the underlying path.
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
