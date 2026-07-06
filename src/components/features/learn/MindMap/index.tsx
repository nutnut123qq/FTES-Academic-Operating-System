"use client"

import React, { useMemo } from "react"
import { Typography, cn } from "@heroui/react"
import { useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { useRouter } from "@/i18n/navigation"
import { LearnNavRail } from "../shared/LearnNavRail"
import { useQueryLearnCourseSwr } from "../hooks/useQueryLearnCourseSwr"
import type { LearnModule } from "../hooks/useQueryLearnCourseSwr"

/** Per-module completion state driving node color. */
type NodeState = "done" | "current" | "locked"

/** A laid-out module node (polar → cartesian). */
interface PlacedNode {
    module: LearnModule
    x: number
    y: number
    angle: number
    state: NodeState
}

const VIEW = 1000
const CENTER = VIEW / 2
const RADIUS = 360

/** Classify a module's state from its lessons + the "current" pointer. */
const stateOf = (module: LearnModule, currentModuleId: string | null): NodeState => {
    const allDone = module.lessons.every((lesson) => lesson.isCompleted)
    if (allDone) {
        return "done"
    }
    if (module.id === currentModuleId) {
        return "current"
    }
    return "locked"
}

/** Fill className per node state (SVG fill via Tailwind utility, matches repo convention). */
const STATE_FILL_CLASS: Record<NodeState, string> = {
    done: "fill-success",
    current: "fill-accent",
    locked: "fill-default",
}

/**
 * Course mind map (priority 3). A radial SVG diagram: a central "Fullstack
 * Mastery N%" node, connectors out to every module card ("You are here" on the
 * current module), and a status legend. Pure SVG/CSS — no WebGL. Nodes link into
 * the module's first lesson.
 *
 * Full-bleed inside the learn layout padding. Feature owns data + routing + i18n.
 */
export const MindMap = () => {
    const t = useTranslations("learn")
    const router = useRouter()
    const { courseId } = useParams<{ courseId: string }>()
    const { modules, header, navSections, error, mutate } = useQueryLearnCourseSwr(courseId)

    // The current module = the one owning the continue pointer.
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
                angle,
                x: CENTER + RADIUS * Math.cos(angle),
                y: CENTER + RADIUS * Math.sin(angle),
                state: stateOf(module, currentModuleId),
            }
        })
    }, [modules, currentModuleId])

    const openModule = (module: LearnModule) => {
        const first = module.lessons[0]
        if (first) {
            router.push(`/courses/${courseId}/learn/content/modules/${module.id}/contents/${first.id}`)
        }
    }

    return (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
            <aside className="lg:sticky lg:top-20 lg:self-start">
                <LearnNavRail courseId={courseId} sections={navSections} activeKey="mind-map" />
            </aside>

            <div className="flex min-w-0 flex-col gap-4">
                <div className="flex items-center justify-between gap-3">
                    <Typography type="h6" weight="bold">
                        {t("mindMap.title")}
                    </Typography>
                    <Legend
                        labels={{
                            done: t("mindMap.legend.done"),
                            current: t("mindMap.legend.current"),
                            locked: t("mindMap.legend.locked"),
                        }}
                    />
                </div>

                <AsyncContent
                    isLoading={modules.length === 0 && !error}
                    skeleton={<Skeleton className="aspect-square w-full rounded-3xl" />}
                    error={modules.length === 0 ? error : undefined}
                    errorContent={{
                        title: t("mindMap.error"),
                        onRetry: () => { void mutate() },
                        retryLabel: t("common.retry"),
                    }}
                >
                    <div className="overflow-x-auto rounded-3xl border border-default bg-surface p-2">
                        <svg
                            viewBox={`0 0 ${VIEW} ${VIEW}`}
                            role="img"
                            aria-label={t("mindMap.title")}
                            className="mx-auto block h-auto w-full min-w-[640px] max-w-3xl"
                        >
                            {/* connectors */}
                            {nodes.map((node) => (
                                <line
                                    key={`edge-${node.module.id}`}
                                    x1={CENTER}
                                    y1={CENTER}
                                    x2={node.x}
                                    y2={node.y}
                                    strokeWidth={2}
                                    className="stroke-default opacity-60"
                                />
                            ))}

                            {/* module nodes */}
                            {nodes.map((node) => (
                                <ModuleNode
                                    key={node.module.id}
                                    node={node}
                                    youAreHereLabel={t("mindMap.youAreHere")}
                                    onOpen={() => openModule(node.module)}
                                />
                            ))}

                            {/* central node */}
                            <g>
                                <circle cx={CENTER} cy={CENTER} r={78} className="fill-accent" />
                                <text
                                    x={CENTER}
                                    y={CENTER - 6}
                                    textAnchor="middle"
                                    className="fill-white text-[20px] font-bold"
                                >
                                    {header?.title ?? ""}
                                </text>
                                <text
                                    x={CENTER}
                                    y={CENTER + 22}
                                    textAnchor="middle"
                                    className="fill-white/90 text-[18px] font-semibold"
                                >
                                    {t("content.percent", { value: header?.progressPercent ?? 0 })}
                                </text>
                            </g>
                        </svg>
                    </div>
                </AsyncContent>
            </div>
        </div>
    )
}

/** A single module node — numbered circle + label + optional "you are here". */
const ModuleNode = ({
    node,
    youAreHereLabel,
    onOpen,
}: {
    node: PlacedNode
    youAreHereLabel: string
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
                    STATE_FILL_CLASS[node.state],
                    node.state === "current" ? "stroke-accent" : "stroke-transparent",
                    node.state === "locked" && "opacity-70",
                )}
            />
            <text
                x={node.x}
                y={node.y + 6}
                textAnchor="middle"
                className={cn(
                    "text-[18px] font-bold",
                    node.state === "locked" ? "fill-foreground" : "fill-white",
                )}
            >
                {node.module.order}
            </text>
            <text
                x={node.x}
                y={labelBelow ? node.y + 52 : node.y - 42}
                textAnchor="middle"
                className="fill-foreground text-[13px] font-medium"
            >
                {truncateLabel(node.module.title)}
            </text>
            {node.state === "current" ? (
                <text
                    x={node.x}
                    y={labelBelow ? node.y + 70 : node.y - 24}
                    textAnchor="middle"
                    className="fill-accent text-[12px] font-semibold"
                >
                    {youAreHereLabel}
                </text>
            ) : null}
        </g>
    )
}

/** The status legend (done / current / locked). */
const Legend = ({ labels }: { labels: Record<NodeState, string> }) => (
    <div className="flex flex-wrap items-center gap-3">
        {(["done", "current", "locked"] as const).map((state) => (
            <span key={state} className="flex items-center gap-1.5">
                <span
                    className={cn(
                        "size-3 rounded-full",
                        state === "done" && "bg-success",
                        state === "current" && "bg-accent",
                        state === "locked" && "bg-default",
                    )}
                />
                <Typography type="body-xs" color="muted">
                    {labels[state]}
                </Typography>
            </span>
        ))}
    </div>
)

/** Keep node labels short so they don't overlap neighbours. */
const truncateLabel = (text: string) => (text.length > 16 ? `${text.slice(0, 16)}…` : text)
