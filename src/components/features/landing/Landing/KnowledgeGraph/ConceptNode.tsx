"use client"

import React from "react"
import { Handle, type NodeProps, Position } from "@xyflow/react"
import { Button, Typography, cn } from "@heroui/react"
import { ArrowRightIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { TRACK_CONFIG, NODE_DEGREE, bubbleRadius, type TrackKey } from "./data"
import { LANDING_TRACK_TAG } from "../constants"

/** React Flow node-type id for a knowledge-graph concept. */
export const CONCEPT_NODE_TYPE = "concept" as const

/** Data carried on a concept node. */
export interface ConceptNodeData {
    label: string
    track: TrackKey
    /** Dim when another node is hovered and this one isn't connected to it. */
    dimmed?: boolean
    /** This node is the one whose popover is open. */
    selected?: boolean
    /** Open the flagship course that teaches this concept. */
    onOpenCourse?: (track: TrackKey) => void
    [key: string]: unknown
}

/** Centred, invisible handle — kept for layout/positioning only (no edges are drawn). */
const centreHandleClass = "!size-0 !min-w-0 !border-0 !bg-transparent"
const centreHandleStyle = { left: "50%", top: "50%", transform: "translate(-50%, -50%)" } as const

/**
 * A glowing concept BUBBLE — a translucent track-coloured circle sized by its degree
 * (hubs big, leaves small) + soft glow + colored ring, with the label CENTRED on it,
 * its font scaled by the same degree (hub labels read bigger). No connecting edges —
 * a pure constellation. When `selected`, a popover floats above with a one-line blurb
 * (i18n by node id) + a "Vào khóa" CTA.
 *
 * @param props - React Flow {@link NodeProps} carrying {@link ConceptNodeData}.
 */
export const ConceptNode = ({ id, data }: NodeProps) => {
    const { label, track, dimmed, selected, onOpenCourse } = data as ConceptNodeData
    const t = useTranslations()
    const cfg = TRACK_CONFIG[track]
    const degree = NODE_DEGREE[id] ?? 1
    const r = bubbleRadius(degree)
    const fontSize = Math.round(11 + degree * 0.8)
    return (
        <div
            className={cn("relative cursor-pointer transition-opacity duration-300", dimmed && "opacity-25")}
            style={{ width: r * 2, height: r * 2 }}
        >
            {/* bubble — diameter ∝ degree; translucent track fill + colored ring + soft glow */}
            <div
                className={cn("absolute inset-0 rounded-full border", cfg.ring, selected && "ring-2 ring-accent")}
                style={{
                    backgroundColor: `color-mix(in oklch, ${cfg.glow} 22%, transparent)`,
                    boxShadow: `0 0 ${Math.round(r * 0.9)}px -2px ${cfg.glow}`,
                }}
            >
                <Handle type="target" position={Position.Top} isConnectable={false} className={centreHandleClass} style={centreHandleStyle} />
                <Handle type="source" position={Position.Bottom} isConnectable={false} className={centreHandleClass} style={centreHandleStyle} />
            </div>
            {/* label centred ON the bubble; font scales with degree (may overflow small bubbles) */}
            <span
                className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center font-medium whitespace-nowrap text-foreground"
                style={{ fontSize }}
            >
                {label}
            </span>

            {selected ? (
                <div
                    className="nodrag nopan absolute bottom-full left-1/2 z-50 mb-2 w-60 -translate-x-1/2 cursor-default rounded-2xl border border-default bg-surface p-3 text-left"
                    onClick={(event) => event.stopPropagation()}
                >
                    <div className="mb-1 flex items-center gap-1.5">
                        <span aria-hidden className={cn("size-1.5 shrink-0 rounded-full", cfg.dot)} />
                        <span className="text-xs font-semibold text-foreground">{label}</span>
                        <span className="ml-auto text-[10px] text-muted">{LANDING_TRACK_TAG[track]}</span>
                    </div>
                    <Typography type="body-xs" color="muted" className="whitespace-normal">
                        {t(`landing.treasure.graph.${id}`)}
                    </Typography>
                    <Button variant="primary" size="sm" className="mt-2" onPress={() => onOpenCourse?.(track)}>
                        {t("landing.courses.view")}
                        <ArrowRightIcon aria-hidden focusable="false" className="size-3.5" />
                    </Button>
                </div>
            ) : null}
        </div>
    )
}
