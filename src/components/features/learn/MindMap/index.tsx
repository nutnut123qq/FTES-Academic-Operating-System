"use client"

import React, { useMemo } from "react"
import { Button, Typography, cn } from "@heroui/react"
import { ArrowRightIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { useRouter } from "@/i18n/navigation"
import { useQueryLearnCourseSwr } from "../hooks/useQueryLearnCourseSwr"
import type { LearnModule } from "../hooks/useQueryLearnCourseSwr"

/** Per-module completion state (mirrors StarCI's 5-state legend, minus "current"). */
type ModuleStatus = "done" | "inProgress" | "notStarted" | "locked"

/** A laid-out module node (polar → cartesian). */
interface PlacedNode {
    module: LearnModule
    x: number
    y: number
    /** Aggregate progress state. */
    status: ModuleStatus
    /** The "you are here" module. */
    isCurrent: boolean
    lessonsRead: number
    lessonsTotal: number
}

const VIEW = 1000
const CENTER = VIEW / 2
const RADIUS = 360

/** Classify a module from its lessons + the "current" pointer + premium gate. */
const statusOf = (module: LearnModule): ModuleStatus => {
    const total = module.lessons.length
    const done = module.lessons.filter((lesson) => lesson.isCompleted).length
    const anyPremium = module.lessons.some((lesson) => lesson.isPremium)
    if (done === total && total > 0) {
        return "done"
    }
    if (done > 0) {
        return "inProgress"
    }
    return anyPremium ? "locked" : "notStarted"
}

/** SVG fill className per status. */
const STATUS_FILL: Record<ModuleStatus, string> = {
    done: "fill-success",
    inProgress: "fill-warning",
    notStarted: "fill-default",
    locked: "fill-separator",
}

/** Legend swatch per status. */
const LEGEND_SWATCH: Record<"current" | ModuleStatus, string> = {
    current: "bg-accent",
    done: "bg-success",
    inProgress: "bg-warning",
    notStarted: "bg-default",
    locked: "bg-separator",
}

/**
 * Course mind map (StarCI port — pure-SVG variant). StarCI's map is built on
 * `@xyflow/react` (React Flow) with pan/zoom/fullscreen; per the port constraints
 * that heavy dependency is NOT pulled in — this reproduces the same reading (a
 * central course node radiating to module nodes tinted by progress, "you are
 * here", a 5-state legend, and a "Continue" CTA) as an accessible, dependency-free
 * radial SVG. Full-bleed inside the layout (no rail).
 *
 * NOTE (mock/simplify): no pan/zoom/fullscreen and no per-module lesson expansion
 * (React-Flow-specific). The node states + legend + continue affordance match.
 */
export const MindMap = () => {
    const t = useTranslations("learn")
    const router = useRouter()
    const { courseId } = useParams<{ courseId: string }>()
    const { modules, header, error, mutate } = useQueryLearnCourseSwr(courseId)

    const currentModuleId = useMemo(() => {
        if (!header?.continueLessonId) {
            return modules[0]?.id ?? null
        }
        return header.continueLessonId.split("-")[0]
    }, [header, modules])

    const nodes: Array<PlacedNode> = useMemo(() => {
        const count = modules.length
        return modules.map((module, index) => {
            const angle = (index / Math.max(count, 1)) * Math.PI * 2 - Math.PI / 2
            return {
                module,
                x: CENTER + RADIUS * Math.cos(angle),
                y: CENTER + RADIUS * Math.sin(angle),
                status: statusOf(module),
                isCurrent: module.id === currentModuleId,
                lessonsRead: module.lessons.filter((lesson) => lesson.isCompleted).length,
                lessonsTotal: module.lessons.length,
            }
        })
    }, [modules, currentModuleId])

    const allDone = modules.length > 0 && nodes.every((node) => node.status === "done")

    const openModule = (module: LearnModule) => {
        const first = module.lessons[0]
        if (first) {
            router.push(`/courses/${courseId}/learn/content/modules/${module.id}/contents/${first.id}`)
        }
    }
    const onContinue = () => {
        if (header?.continueLessonId) {
            const moduleId = header.continueLessonId.split("-")[0]
            router.push(`/courses/${courseId}/learn/content/modules/${moduleId}/contents/${header.continueLessonId}`)
        }
    }

    return (
        <div className="relative flex min-h-[calc(100dvh-4rem)] w-full flex-col gap-4 p-6">
            <div className="flex items-center justify-between gap-3">
                <Typography type="h6" weight="bold">
                    {t("mindMap.title")}
                </Typography>
                <Legend labels={{
                    current: t("mindMap.legend.current"),
                    done: t("mindMap.legend.done"),
                    inProgress: t("mindMap.legend.inProgress"),
                    notStarted: t("mindMap.legend.notStarted"),
                    locked: t("mindMap.legend.locked"),
                }}
                />
            </div>

            <AsyncContent
                isLoading={modules.length === 0 && !error}
                skeleton={<Skeleton className="aspect-square w-full max-w-3xl rounded-3xl" />}
                isEmpty={modules.length === 0}
                emptyContent={{ title: t("mindMap.empty") }}
                error={modules.length === 0 ? error : undefined}
                errorContent={{
                    title: t("mindMap.error"),
                    onRetry: () => { void mutate() },
                    retryLabel: t("common.retry"),
                }}
            >
                <div className="relative flex-1 overflow-x-auto rounded-3xl border border-default bg-surface p-2">
                    {/* continue CTA floats over the canvas (StarCI Panel top-center) */}
                    {header?.continueLessonId && !allDone ? (
                        <div className="absolute left-1/2 top-4 z-10 -translate-x-1/2">
                            <Button variant="primary" className="rounded-full shadow-lg" onPress={onContinue}>
                                {t("mindMap.continue")}
                                <ArrowRightIcon aria-hidden focusable="false" className="size-5" />
                            </Button>
                        </div>
                    ) : allDone ? (
                        <div className="absolute left-1/2 top-4 z-10 -translate-x-1/2 rounded-full bg-surface px-4 py-2 shadow-lg">
                            <Typography type="body-sm" weight="semibold" className="text-success">
                                {t("mindMap.allDone")}
                            </Typography>
                        </div>
                    ) : null}

                    <svg
                        viewBox={`0 0 ${VIEW} ${VIEW}`}
                        role="img"
                        aria-label={t("mindMap.title")}
                        className="mx-auto block h-auto w-full min-w-[640px] max-w-3xl"
                    >
                        {nodes.map((node) => (
                            <line
                                key={`edge-${node.module.id}`}
                                x1={CENTER}
                                y1={CENTER}
                                x2={node.x}
                                y2={node.y}
                                strokeWidth={node.isCurrent ? 3 : 2}
                                className={cn(node.isCurrent ? "stroke-accent" : "stroke-default opacity-50")}
                            />
                        ))}
                        {nodes.map((node) => (
                            <ModuleNode
                                key={node.module.id}
                                node={node}
                                youAreHereLabel={t("mindMap.youAreHere")}
                                lessonsLabel={t("mindMap.moduleLessons", { read: node.lessonsRead, total: node.lessonsTotal })}
                                onOpen={() => openModule(node.module)}
                            />
                        ))}
                        <g>
                            <circle cx={CENTER} cy={CENTER} r={78} className="fill-accent" />
                            <text x={CENTER} y={CENTER - 6} textAnchor="middle" className="fill-white text-[20px] font-bold">
                                {header?.title ?? ""}
                            </text>
                            <text x={CENTER} y={CENTER + 22} textAnchor="middle" className="fill-white/90 text-[18px] font-semibold">
                                {t("content.percent", { value: header?.progressPercent ?? 0 })}
                            </text>
                        </g>
                    </svg>
                </div>
            </AsyncContent>
        </div>
    )
}

/** A single module node — numbered circle + label + lesson count + "you are here". */
const ModuleNode = ({
    node,
    youAreHereLabel,
    lessonsLabel,
    onOpen,
}: {
    node: PlacedNode
    youAreHereLabel: string
    lessonsLabel: string
    onOpen: () => void
}) => {
    const labelBelow = node.y > CENTER
    return (
        <g
            className="cursor-pointer"
            role="button"
            tabIndex={0}
            aria-label={node.module.title}
            onClick={onOpen}
            onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault()
                    onOpen()
                }
            }}
        >
            <circle
                cx={node.x}
                cy={node.y}
                r={30}
                strokeWidth={4}
                className={cn(
                    STATUS_FILL[node.status],
                    node.isCurrent ? "stroke-accent" : "stroke-transparent",
                    node.status === "locked" && "opacity-80",
                )}
            />
            <text
                x={node.x}
                y={node.y + 6}
                textAnchor="middle"
                className={cn("text-[18px] font-bold", node.status === "notStarted" || node.status === "locked" ? "fill-foreground" : "fill-white")}
            >
                {node.module.order}
            </text>
            <text x={node.x} y={labelBelow ? node.y + 52 : node.y - 44} textAnchor="middle" className="fill-foreground text-[13px] font-medium">
                {truncateLabel(node.module.title)}
            </text>
            <text x={node.x} y={labelBelow ? node.y + 70 : node.y - 26} textAnchor="middle" className="fill-muted text-[12px]">
                {node.isCurrent ? youAreHereLabel : lessonsLabel}
            </text>
        </g>
    )
}

/** The 5-state status legend. */
const Legend = ({ labels }: { labels: Record<"current" | ModuleStatus, string> }) => (
    <div className="flex flex-wrap items-center gap-3">
        {(["current", "done", "inProgress", "notStarted", "locked"] as const).map((state) => (
            <span key={state} className="flex items-center gap-1.5">
                <span className={cn("size-3 rounded-full", LEGEND_SWATCH[state])} />
                <Typography type="body-xs" color="muted">
                    {labels[state]}
                </Typography>
            </span>
        ))}
    </div>
)

/** Keep node labels short so they don't overlap neighbours. */
const truncateLabel = (text: string) => (text.length > 16 ? `${text.slice(0, 16)}…` : text)
