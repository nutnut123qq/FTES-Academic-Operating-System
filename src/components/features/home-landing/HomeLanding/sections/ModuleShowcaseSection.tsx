"use client"

import React from "react"
import { BriefcaseIcon, GraduationCapIcon, ChatCircleIcon, ArrowRightIcon, type Icon } from "@phosphor-icons/react"
import { Typography, cn } from "@heroui/react"
import { useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"
import { MODULE_CARDS } from "../content"

/** Icon per module card key. */
const MODULE_ICON: Record<string, Icon> = {
    workplace: BriefcaseIcon,
    course: GraduationCapIcon,
    community: ChatCircleIcon,
}

/**
 * Journey-detail module showcase — what's inside each stop of the journey: the Subject
 * Workplace, a Course, and the Cộng đồng. Each is a card (icon + title + description as
 * crawlable text) linking to its module route via locale-aware navigation.
 */
export const ModuleShowcaseSection = () => {
    const t = useTranslations("homeLanding")
    return (
        <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
            <div className="mb-10 flex flex-col items-center gap-2 text-center">
                <Typography type="body-sm" color="muted">
                    {t("modules.eyebrow")}
                </Typography>
                <Typography type="h3" weight="bold">
                    {t("modules.title")}
                </Typography>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {MODULE_CARDS.map((card) => {
                    const ModuleIcon = MODULE_ICON[card.key] ?? BriefcaseIcon
                    return (
                        <Link
                            key={card.key}
                            href={card.href}
                            className={cn(
                                "group flex flex-col gap-3 rounded-large border border-separator p-6 no-underline transition-colors hover:bg-default/40",
                            )}
                        >
                            <div className="flex size-11 items-center justify-center rounded-large bg-accent/10 text-accent">
                                <ModuleIcon className="size-6" aria-hidden focusable="false" />
                            </div>
                            <Typography type="h6" weight="bold">
                                {t(`modules.cards.${card.key}.title`)}
                            </Typography>
                            <Typography type="body-sm" color="muted">
                                {t(`modules.cards.${card.key}.desc`)}
                            </Typography>
                            <span className="mt-auto flex items-center gap-1 pt-2 text-sm font-medium text-accent">
                                {t("modules.explore")}
                                <ArrowRightIcon className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden focusable="false" />
                            </span>
                        </Link>
                    )
                })}
            </div>
        </section>
    )
}
