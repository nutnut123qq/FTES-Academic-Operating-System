"use client"

import React from "react"
import { Chip, Typography, cn } from "@heroui/react"
import { GraduationCapIcon, LockKeyIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { SKILL_DOMAINS } from "../hooks/useQuerySkillGraphSwr"
import type { SkillDomain, SkillNode } from "../hooks/useQuerySkillGraphSwr"
import { domainVar } from "../palette"

/** Props for {@link SkillListFallback}. */
export interface SkillListFallbackProps {
    nodes: Array<SkillNode>
    /** Domains currently allowed (empty = all). */
    activeDomains: Set<SkillDomain>
    onSelect: (skill: SkillNode) => void
}

/**
 * Mobile (`<sm`) fallback: skills grouped by domain as tappable rows opening the
 * same detail panel. Preserves browse + filter + detail — a list is friendlier
 * than a force graph on a 380px screen.
 */
export const SkillListFallback = ({ nodes, activeDomains, onSelect }: SkillListFallbackProps) => {
    const t = useTranslations()
    const visible = nodes.filter((node) => activeDomains.size === 0 || activeDomains.has(node.domain))

    return (
        <div className="flex flex-col gap-4">
            {SKILL_DOMAINS.map((domain) => {
                const group = visible.filter((node) => node.domain === domain)
                if (group.length === 0) return null
                return (
                    <section key={domain} className="flex flex-col gap-2">
                        <span className="flex items-center gap-2">
                            <span
                                className="size-3 shrink-0 rounded-full"
                                style={{ backgroundColor: domainVar(domain) }}
                                aria-hidden
                            />
                            <Typography type="body-sm" weight="bold">
                                {t(`skillGraph.domains.${domain}`)}
                            </Typography>
                        </span>
                        <ul className="flex flex-col gap-2">
                            {group.map((skill) => (
                                <li key={skill.id}>
                                    <button
                                        type="button"
                                        onClick={() => onSelect(skill)}
                                        className={cn(
                                            "flex w-full items-center gap-3 rounded-2xl border border-separator p-3 text-left transition-colors",
                                            "hover:bg-default/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                                        )}
                                    >
                                        {skill.status === "mastered" ? (
                                            <GraduationCapIcon
                                                aria-hidden
                                                focusable="false"
                                                className="size-4 shrink-0 text-success"
                                                weight="fill"
                                            />
                                        ) : skill.status === "locked" ? (
                                            <LockKeyIcon
                                                aria-hidden
                                                focusable="false"
                                                className="size-4 shrink-0 text-muted"
                                            />
                                        ) : (
                                            <span className="size-4 shrink-0" aria-hidden />
                                        )}
                                        <Typography type="body-sm" weight="medium" className="min-w-0 flex-1" truncate>
                                            {skill.name}
                                        </Typography>
                                        <Chip size="sm" variant="soft" color="accent">
                                            {skill.level}%
                                        </Chip>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </section>
                )
            })}
        </div>
    )
}
