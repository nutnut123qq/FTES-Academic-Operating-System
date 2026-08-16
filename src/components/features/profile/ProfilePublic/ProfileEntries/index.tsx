"use client"

import React from "react"
import { Chip, Typography } from "@heroui/react"
import { useLocale, useTranslations } from "next-intl"
import { ArrowSquareOutIcon, GithubLogoIcon, MedalIcon } from "@phosphor-icons/react"
import type { AchievementView, ProjectView } from "@/modules/api/rest/profile"
import { toEarnedDateLabel } from "../../ProfileBadges/model"
import { useBadgeTitle } from "../../ProfileBadges/useBadgeTitle"

/**
 * Locale date line; `""` when the BE sent no / an unparseable timestamp — callers
 * branch on the empty string and render nothing rather than "Invalid Date".
 * Thin wrapper over the shared {@link toEarnedDateLabel} so the profile has ONE
 * date parser (it also pins date-only strings to local midnight, which stops a
 * `yyyy-mm-dd` from rendering as the previous day west of Greenwich).
 */
export const toDateLabel = (iso: string | null | undefined, locale: string): string =>
    toEarnedDateLabel(iso, locale) ?? ""

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

/**
 * One achievement row (`achievements[]`), dated by `achievedAt` when present.
 *
 * The title goes through {@link useBadgeTitle}: system rows written for a
 * gamification badge are stored as `"Badge FIRST_LESSON"` whenever the award
 * event carried no name, and a raw backend code must never reach the UI.
 */
export const AchievementRow = ({ achievement }: { achievement: AchievementView }) => {
    const t = useTranslations()
    const locale = useLocale()
    const badgeTitle = useBadgeTitle()
    const dateLabel = toDateLabel(achievement.achievedAt, locale)

    return (
        <div className="flex items-start gap-3 rounded-2xl border border-separator p-4">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-large bg-accent/10 text-accent">
                <MedalIcon className="size-4" aria-hidden focusable="false" />
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
                <Typography type="body-sm" weight="medium" truncate>
                    {badgeTitle(achievement.title)}
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
