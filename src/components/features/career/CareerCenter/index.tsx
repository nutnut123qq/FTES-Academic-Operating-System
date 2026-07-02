"use client"

import React from "react"
import { Button, Chip, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import {
    BracketsCurlyIcon,
    BrowserIcon,
    CloudIcon,
    DeviceMobileIcon,
    RobotIcon,
    ChartLineIcon,
} from "@phosphor-icons/react"
import type { CareerRoadmap } from "../hooks/useQueryCareerSwr"
import { useQueryCareerSwr } from "../hooks/useQueryCareerSwr"

/** Icon per roadmap key — Phosphor `*Icon`, rendered in a bg-accent/10 tile. */
const ROADMAP_ICON: Record<CareerRoadmap["key"], React.ComponentType<{ className?: string }>> = {
    backend: BracketsCurlyIcon,
    frontend: BrowserIcon,
    mobile: DeviceMobileIcon,
    ai: RobotIcon,
    data: ChartLineIcon,
    devops: CloudIcon,
}

/**
 * Career Center (§21) — skill graph + career roadmaps + jobs. FE-only mock shell:
 * three stacked sections on one page. Feature owns data (mock) + layout; tokens own
 * the look. Buttons are mock (no handlers yet). ponytail: hand-rolled sections.
 */
export const CareerCenter = () => {
    const t = useTranslations("careerCenter")
    const { skills, roadmaps, jobs } = useQueryCareerSwr()

    return (
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
            <div className="flex flex-col gap-1">
                <Typography type="h4" weight="bold">
                    {t("title")}
                </Typography>
                <Typography type="body-sm" color="muted">
                    {t("subtitle")}
                </Typography>
            </div>

            {/* skill graph */}
            <section className="flex flex-col gap-3">
                <Typography type="h6" weight="bold">
                    {t("skills")}
                </Typography>
                <div className="flex flex-col gap-4">
                    {skills.map((skill) => {
                        const value = Math.round(skill.progress)
                        return (
                            <div key={skill.id} className="flex flex-col gap-1.5">
                                <div className="flex items-center justify-between gap-3">
                                    <Typography type="body-sm" weight="medium" className="min-w-0" truncate>
                                        {skill.name}
                                    </Typography>
                                    <Typography type="body-xs" className="shrink-0 text-accent" weight="medium">
                                        {value}%
                                    </Typography>
                                </div>
                                <div
                                    className="h-2 w-full overflow-hidden rounded-full bg-default/40"
                                    role="progressbar"
                                    aria-label={t("progressLabel", { skill: skill.name })}
                                    aria-valuenow={value}
                                    aria-valuemin={0}
                                    aria-valuemax={100}
                                >
                                    <div className="h-full rounded-full bg-accent" style={{ width: `${value}%` }} />
                                </div>
                            </div>
                        )
                    })}
                </div>
            </section>

            {/* career roadmaps */}
            <section className="flex flex-col gap-3 border-t border-separator pt-6">
                <Typography type="h6" weight="bold">
                    {t("roadmaps")}
                </Typography>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {roadmaps.map((roadmap) => {
                        const Icon = ROADMAP_ICON[roadmap.key]
                        return (
                            <div
                                key={roadmap.id}
                                className="flex flex-col gap-3 rounded-large border border-separator p-4"
                            >
                                <div className="flex items-center gap-3">
                                    <div
                                        className="flex size-11 shrink-0 items-center justify-center rounded-large bg-accent/10 text-accent"
                                        aria-hidden
                                    >
                                        <Icon className="size-5" />
                                    </div>
                                    <Typography type="body-sm" weight="medium" className="min-w-0" truncate>
                                        {t(`roadmapKeys.${roadmap.key}`)}
                                    </Typography>
                                </div>
                                <Button size="sm" variant="ghost">
                                    {t("viewRoadmap")}
                                </Button>
                            </div>
                        )
                    })}
                </div>
            </section>

            {/* jobs */}
            <section className="flex flex-col gap-3 border-t border-separator pt-6">
                <Typography type="h6" weight="bold">
                    {t("jobs")}
                </Typography>
                <div className="flex flex-col gap-3">
                    {jobs.map((job) => (
                        <div
                            key={job.id}
                            className="flex flex-wrap items-center gap-3 rounded-large border border-separator p-4"
                        >
                            <div className="min-w-0 flex-1">
                                <Typography type="body-sm" weight="medium" truncate>
                                    {job.title}
                                </Typography>
                                <Typography type="body-xs" color="muted" className="truncate">
                                    {job.company}
                                </Typography>
                            </div>
                            <Chip size="sm" variant="soft" color="accent">
                                {t(`jobTypes.${job.type}`)}
                            </Chip>
                            <Button size="sm" variant="secondary">
                                {t("apply")}
                            </Button>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    )
}
