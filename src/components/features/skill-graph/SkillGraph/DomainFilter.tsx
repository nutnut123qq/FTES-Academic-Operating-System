"use client"

import React from "react"
import { Button } from "@heroui/react"
import { useTranslations } from "next-intl"
import { SKILL_DOMAINS } from "../hooks/useQuerySkillGraphSwr"
import type { SkillDomain } from "../hooks/useQuerySkillGraphSwr"
import { domainVar } from "../palette"

/** Props for {@link DomainFilter}. */
export interface DomainFilterProps {
    /** Currently active domains (empty set = show all). */
    active: Set<SkillDomain>
    onToggle: (domain: SkillDomain) => void
    onClear: () => void
}

/** Toggle chips filtering visible nodes by career domain. */
export const DomainFilter = ({ active, onToggle, onClear }: DomainFilterProps) => {
    const t = useTranslations()

    return (
        <div className="flex flex-wrap items-center gap-2">
            <Button
                size="sm"
                variant={active.size === 0 ? "secondary" : "ghost"}
                onPress={onClear}
                aria-pressed={active.size === 0}
            >
                {t("skillGraph.filter.all")}
            </Button>
            {SKILL_DOMAINS.map((domain) => {
                const isActive = active.has(domain)
                return (
                    <Button
                        key={domain}
                        size="sm"
                        variant={isActive ? "secondary" : "ghost"}
                        onPress={() => onToggle(domain)}
                        aria-pressed={isActive}
                    >
                        <span
                            className="size-3 shrink-0 rounded-full"
                            style={{ backgroundColor: domainVar(domain) }}
                            aria-hidden
                        />
                        {t(`skillGraph.domains.${domain}`)}
                    </Button>
                )
            })}
        </div>
    )
}
