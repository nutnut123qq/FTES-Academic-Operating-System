"use client"

import React, { memo } from "react"
import { cn } from "@heroui/react"
import {
    BookOpenIcon,
    CheckCircleIcon,
    type Icon,
    LockSimpleIcon,
    SparkleIcon,
    StackIcon,
} from "@phosphor-icons/react"
import { Handle, type NodeProps, Position } from "@xyflow/react"
import { useTranslations } from "next-intl"
import { exerciseSolverIcon, normalizeExerciseType } from "../exerciseType"
import type { MindMapNodeData, MindMapNodeKind } from "./build"
import { STATUS_CARD_CLASS } from "./status"

/** Width per level — modules read largest, exercises smallest (visual hierarchy). */
const WIDTH_CLASS: Record<MindMapNodeKind, string> = {
    module: "w-[280px] min-h-[92px]",
    lesson: "w-[260px] min-h-[72px]",
    exercise: "w-[240px] min-h-[64px]",
}

/** Title type scale per level. */
const TITLE_CLASS: Record<MindMapNodeKind, string> = {
    module: "text-sm font-semibold",
    lesson: "text-sm font-medium",
    exercise: "text-xs font-medium",
}

/** Leading glyph for a content node. */
const nodeIcon = (data: MindMapNodeData): Icon => {
    if (data.isLocked) {
        return LockSimpleIcon
    }
    switch (data.kind) {
    case "module":
        return StackIcon
    case "lesson":
        return BookOpenIcon
    default:
        return exerciseSolverIcon(normalizeExerciseType(data.exerciseType))
    }
}

/**
 * Unified content node for the mind map — one component renders modules, lessons and
 * exercises, tinted by the typed 3-state {@link STATUS_CARD_CLASS}: completed = GREEN,
 * inProgress = ORANGE, notStarted = light warm neutral. The premium lock is orthogonal
 * (dimmed + lock glyph). The "you are here" module/lesson wins with a full accent ring.
 *
 * Draggable + clickable: dragging is handled by React Flow, the click bubbles to the
 * canvas `onNodeClick`, which routes / opens the package gate.
 */
const MindMapContentNodeBase = ({ data }: NodeProps) => {
    const node = data as MindMapNodeData
    const t = useTranslations("learn")
    const kind = node.kind as MindMapNodeKind
    const IconGlyph = nodeIcon(node)

    return (
        <div
            className={cn(
                "relative flex cursor-pointer flex-col items-stretch gap-1.5 rounded-2xl border px-3 py-2 text-left shadow-sm transition-all duration-150",
                WIDTH_CLASS[kind],
                STATUS_CARD_CLASS[node.status],
                "hover:border-accent hover:shadow-md hover:ring-2 hover:ring-accent/30",
                node.isRecommended && !node.isCurrent && "border-dashed border-accent ring-2 ring-accent/40",
                node.isCurrent && "border-accent ring-2 ring-accent",
                node.isLocked && "opacity-80",
            )}
        >
            {node.isRecommended ? (
                <span className="absolute -right-1.5 -top-2 flex items-center gap-1 rounded-full border border-accent bg-content1 px-1.5 py-0.5 text-xs font-medium text-accent shadow-sm">
                    <SparkleIcon weight="fill" aria-hidden focusable="false" className="size-3" />
                    {t("mindMap.progress.suggested")}
                </span>
            ) : null}
            <Handle
                type="target"
                position={Position.Left}
                isConnectable={false}
                className="!h-px !w-px !min-h-0 !min-w-0 !border-0 !bg-transparent !opacity-0"
            />
            <div className="flex items-start gap-2">
                <IconGlyph
                    aria-hidden
                    focusable="false"
                    className={cn(
                        "mt-0.5 size-4 shrink-0",
                        node.status === "completed" ? "text-success" : "text-muted",
                    )}
                />
                <span className={cn("min-w-0 flex-1 line-clamp-2 text-foreground", TITLE_CLASS[kind])}>
                    {node.label}
                </span>
                {node.status === "completed" ? (
                    <CheckCircleIcon
                        aria-label={t("mindMap.legend.done")}
                        focusable="false"
                        weight="fill"
                        className="size-4 shrink-0 text-success"
                    />
                ) : null}
            </div>

            {/* meta row: lesson count · exercise type · "you are here" · premium gate */}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 pl-6 text-xs leading-none text-muted">
                {kind === "module" && (node.lessonsTotal ?? 0) > 0 ? (
                    <span>
                        {t("mindMap.moduleLessons", {
                            read: node.lessonsRead ?? 0,
                            total: node.lessonsTotal ?? 0,
                        })}
                    </span>
                ) : null}
                {kind === "exercise" && node.exerciseKind ? (
                    <span>{t(`mindMap.kind.${node.exerciseKind}`)}</span>
                ) : null}
                {node.isCurrent ? (
                    <span className="font-medium text-accent">{t("mindMap.youAreHere")}</span>
                ) : null}
                {node.isLocked ? (
                    <span className="flex items-center gap-1">
                        <LockSimpleIcon aria-hidden focusable="false" className="size-3" />
                        {t("mindMap.legend.locked")}
                    </span>
                ) : null}
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

export const MindMapContentNode = memo(MindMapContentNodeBase)
