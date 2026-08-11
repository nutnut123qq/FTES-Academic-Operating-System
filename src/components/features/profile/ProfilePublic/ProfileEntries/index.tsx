"use client"

import React from "react"
import { Chip, Typography } from "@heroui/react"
import { useLocale, useTranslations } from "next-intl"
import { ArrowSquareOutIcon, GithubLogoIcon, MedalIcon } from "@phosphor-icons/react"
import type { AchievementView, ProjectView } from "@/modules/api/rest/profile"

/** Locale date line; "" when the BE sent no / an unparseable timestamp. */
export const toDateLabel = (iso: string | null | undefined, locale: string): string => {
    if (!iso) {
        return ""
    }
    const date = new Date(iso)
    if (Number.isNaN(date.getTime())) {
        return ""
    }
    return date.toLocaleDateString(locale, { day: "2-digit", month: "2-digit", year: "numeric" })
}

/**
 * One portfolio project from `GET /profiles/{username}.projects`. Repo/demo links render
 * only when the BE actually holds a URL, so a project with neither shows no dead buttons.
 */
export const ProjectCard = ({ project }: { project: ProjectView }) => {
    const t = useTranslations()

    return (
        <div className="flex flex-col gap-3 rounded-2xl border border-separator p-4">
            <div className="flex items-start gap-3">
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <Typography type="body-sm" weight="medium" truncate>
                        {project.title}
                    </Typography>
                    {project.description ? (
                        <Typography type="body-xs" color="muted" className="line-clamp-3">
                            {project.description}
                        </Typography>
                    ) : null}
                </div>
                {project.highlighted ? (
                    <Chip size="sm" variant="soft" color="accent" className="shrink-0">
                        {t("publicProfile.projects.featured")}
                    </Chip>
                ) : null}
            </div>

            {project.techStack.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                    {project.techStack.map((tech) => (
                        <Chip key={tech} size="sm" variant="soft">
                            {tech}
                        </Chip>
                    ))}
                </div>
            ) : null}

            {project.repoUrl || project.demoUrl ? (
                <div className="flex flex-wrap gap-4">
                    {project.repoUrl ? (
                        <a
                            href={project.repoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs text-accent hover:underline"
                        >
                            <GithubLogoIcon className="size-4" aria-hidden focusable="false" />
                            {t("publicProfile.projects.repo")}
                        </a>
                    ) : null}
                    {project.demoUrl ? (
                        <a
                            href={project.demoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs text-accent hover:underline"
                        >
                            <ArrowSquareOutIcon className="size-4" aria-hidden focusable="false" />
                            {t("publicProfile.projects.demo")}
                        </a>
                    ) : null}
                </div>
            ) : null}
        </div>
    )
}

/** One self-declared achievement (`achievements[]`), dated by `achievedAt` when present. */
export const AchievementRow = ({ achievement }: { achievement: AchievementView }) => {
    const t = useTranslations()
    const locale = useLocale()
    const dateLabel = toDateLabel(achievement.achievedAt, locale)

    return (
        <div className="flex items-start gap-3 rounded-2xl border border-separator p-4">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-large bg-accent/10 text-accent">
                <MedalIcon className="size-4" aria-hidden focusable="false" />
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
                <Typography type="body-sm" weight="medium" truncate>
                    {achievement.title}
                </Typography>
                {achievement.description ? (
                    <Typography type="body-xs" color="muted" className="line-clamp-2">
                        {achievement.description}
                    </Typography>
                ) : null}
                {dateLabel ? (
                    <Typography type="body-xs" color="muted">
                        {t("profile.portfolio.achievements.earnedOn", { date: dateLabel })}
                    </Typography>
                ) : null}
            </div>
        </div>
    )
}
