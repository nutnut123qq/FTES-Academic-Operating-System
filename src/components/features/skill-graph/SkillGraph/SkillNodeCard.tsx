"use client"

import React, { memo } from "react"
import { cn } from "@heroui/react"
import { GraduationCapIcon, LockKeyIcon } from "@phosphor-icons/react"
import type { NodeProps } from "@xyflow/react"
import { Handle, Position } from "@xyflow/react"
import { domainVar, nodeSizeForLevel, statusFillAlpha } from "../palette"
import type { SkillNode } from "../hooks/useQuerySkillGraphSwr"

/** Data carried by a skill node inside React Flow. */
export interface SkillNodeData extends Record<string, unknown> {
    skill: SkillNode
    /** Localized status label, for the aria-label. */
    statusLabel: string
    /** True when a hover/focus highlight is active and this node is NOT in it. */
    dimmed: boolean
    /** True when this node is part of the active highlight (self or neighbor). */
    highlighted: boolean
}

/**
 * Memoized custom React Flow node: a circle sized by mastery level, tinted by
 * domain hue, with a status icon. Locked/learning nodes fade via `statusFillAlpha`.
 * Reads domain color from the scoped `var(--sg-domain-*)` set on the graph root.
 */
const SkillNodeCardBase = ({ data }: NodeProps) => {
    const { skill, statusLabel, dimmed, highlighted } = data as SkillNodeData
    const size = nodeSizeForLevel(skill.level)
    const hue = domainVar(skill.domain)
    const alpha = statusFillAlpha[skill.status]

    return (
        <div
            className={cn(
                "group relative flex items-center justify-center rounded-full border text-center transition-opacity duration-150",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                dimmed ? "opacity-25" : "opacity-100",
                highlighted && "ring-2 ring-accent",
            )}
            style={{
                width: size,
                height: size,
                borderColor: hue,
                backgroundColor: `color-mix(in oklch, ${hue} ${Math.round(alpha * 100)}%, var(--surface))`,
            }}
        >
            <Handle type="target" position={Position.Top} className="!opacity-0" isConnectable={false} />
            <Handle type="source" position={Position.Bottom} className="!opacity-0" isConnectable={false} />
            <span className="flex flex-col items-center gap-0.5 px-1">
                {skill.status === "locked" ? (
                    <LockKeyIcon aria-hidden focusable="false" className="size-4 text-muted" />
                ) : skill.status === "mastered" ? (
                    <GraduationCapIcon aria-hidden focusable="false" className="size-4 text-foreground" weight="fill" />
                ) : null}
                <span className="line-clamp-2 text-xs font-medium leading-tight text-foreground">
                    {skill.name}
                </span>
            </span>
            <span className="sr-only">{statusLabel}</span>
        </div>
    )
}

export const SkillNodeCard = memo(SkillNodeCardBase)
