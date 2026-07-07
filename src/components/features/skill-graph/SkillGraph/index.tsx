"use client"

import React, { useCallback, useMemo, useState } from "react"
import { Typography } from "@heroui/react"
import { GraphIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { useSmViewpoint } from "@/hooks/reuseables/useSmViewpoint"
import { useQuerySkillGraphSwr } from "../hooks/useQuerySkillGraphSwr"
import type { SkillDomain, SkillNode } from "../hooks/useQuerySkillGraphSwr"
import { skillGraphColorVars } from "../palette"
import { DomainFilter } from "./DomainFilter"
import { SkillDetailPanel } from "./SkillDetailPanel"
import { SkillGraphCanvas } from "./SkillGraphCanvas"
import { SkillGraphLegend } from "./SkillGraphLegend"
import { SkillGraphSkeleton } from "./SkillGraphSkeleton"
import { SkillListFallback } from "./SkillListFallback"

/** Props for {@link SkillGraph}. */
export interface SkillGraphProps extends WithClassNames<undefined> {
    /** When set, renders a subject-scoped subgraph (skills + 1-hop neighbors). */
    subjectId?: string
    /** Canvas height, as a Tailwind class (default `h-[480px]`). */
    heightClassName?: string
}

/**
 * Skill Graph feature (§21). Spider-web force-directed network of the learner's
 * skills: user node at center, domain clusters around it, mastery-encoded nodes,
 * prerequisite/related edges. Owns SWR + filter + selection; delegates the canvas
 * to {@link SkillGraphCanvas} (React Flow), falls back to a list below `sm`.
 */
export const SkillGraph = ({ subjectId, heightClassName = "h-[480px]", className }: SkillGraphProps) => {
    const t = useTranslations()
    const { isMobile } = useSmViewpoint()
    const scope = useMemo(() => (subjectId ? { subjectId } : undefined), [subjectId])
    const { graph, error, mutate } = useQuerySkillGraphSwr(scope)

    const [activeDomains, setActiveDomains] = useState<Set<SkillDomain>>(new Set())
    const [selected, setSelected] = useState<SkillNode | null>(null)

    const toggleDomain = useCallback((domain: SkillDomain) => {
        setActiveDomains((prev) => {
            const next = new Set(prev)
            if (next.has(domain)) next.delete(domain)
            else next.add(domain)
            return next
        })
    }, [])
    const clearDomains = useCallback(() => setActiveDomains(new Set()), [])
    const closePanel = useCallback(() => setSelected(null), [])

    const isEmpty = !!graph && graph.nodes.length === 0

    return (
        <div className={className} style={skillGraphColorVars()}>
            <AsyncContent
                isLoading={!graph && !error}
                skeleton={<SkillGraphSkeleton heightClassName={heightClassName} />}
                error={!graph ? error : undefined}
                errorContent={{
                    title: t("skillGraph.error"),
                    onRetry: () => void mutate(),
                    retryLabel: t("skillGraph.retry"),
                }}
                isEmpty={isEmpty}
                emptyContent={{
                    title: t("skillGraph.empty.title"),
                    description: t("skillGraph.empty.description"),
                }}
            >
                {graph ? (
                    <div className="flex flex-col gap-3">
                        <DomainFilter active={activeDomains} onToggle={toggleDomain} onClear={clearDomains} />
                        <div className="flex flex-col gap-3 sm:flex-row">
                            <div className="min-w-0 flex-1">
                                {isMobile ? (
                                    <SkillListFallback
                                        nodes={graph.nodes}
                                        activeDomains={activeDomains}
                                        onSelect={setSelected}
                                    />
                                ) : (
                                    <SkillGraphCanvas
                                        graph={graph}
                                        activeDomains={activeDomains}
                                        heightClassName={heightClassName}
                                        onSelect={setSelected}
                                        selectedId={selected?.id}
                                    />
                                )}
                            </div>
                            <div className="flex w-full flex-col gap-3 sm:w-72">
                                {selected ? (
                                    <SkillDetailPanel skill={selected} onClose={closePanel} />
                                ) : (
                                    <>
                                        <div className="hidden items-center gap-2 sm:flex">
                                            <GraphIcon
                                                aria-hidden
                                                focusable="false"
                                                className="size-4 text-muted"
                                            />
                                            <Typography type="body-xs" color="muted">
                                                {t("skillGraph.hint")}
                                            </Typography>
                                        </div>
                                        <SkillGraphLegend />
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                ) : null}
            </AsyncContent>
        </div>
    )
}
