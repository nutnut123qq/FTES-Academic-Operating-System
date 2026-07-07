"use client"

import React from "react"
import { Button, Chip, Skeleton, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import {
    BracketsCurlyIcon,
    BriefcaseIcon,
    BrowserIcon,
    CloudIcon,
    DeviceMobileIcon,
    RobotIcon,
    ChartLineIcon,
} from "@phosphor-icons/react"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { ProgressMeter } from "@/components/blocks/stats/ProgressMeter"
import { useRestWithToast } from "@/modules/toast/hooks"
import { usePostApplyCareerOpportunitySwr } from "@/hooks/swr/api/rest/mutations/usePostApplyCareerOpportunitySwr"
import { useQueryCareerSwr } from "../hooks/useQueryCareerSwr"

/**
 * Icon per roadmap track — Phosphor `*Icon`, rendered in a bg-accent/10 tile.
 * Keyed by the lowercased BE `track`; unknown tracks fall back to a neutral icon.
 */
const ROADMAP_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
    backend: BracketsCurlyIcon,
    frontend: BrowserIcon,
    mobile: DeviceMobileIcon,
    ai: RobotIcon,
    data: ChartLineIcon,
    devops: CloudIcon,
}

/** Maps a BE opportunity `type` to a `jobTypes.*` i18n key (fallback: full-time). */
const JOB_TYPE_KEY: Record<string, "internship" | "fulltime"> = {
    INTERNSHIP: "internship",
    JOB: "fulltime",
    PORTFOLIO_REVIEW: "fulltime",
}

/** Loading skeleton — mirrors the labelled skill status bars (label row + bar). */
const SkillsSkeleton = () => (
    <div className="flex flex-col gap-4">
        {[0, 1, 2, 3].map((row) => (
            <div key={row} className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                    <Skeleton className="h-3 w-40 rounded-full" />
                    <Skeleton className="h-3 w-8 rounded-full" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
            </div>
        ))}
    </div>
)

/** Loading skeleton — mirrors a roadmap card (icon tile + label + button). */
const RoadmapsSkeleton = () => (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((card) => (
            <div key={card} className="flex flex-col gap-3 rounded-2xl border border-separator p-4">
                <div className="flex items-center gap-3">
                    <Skeleton className="size-11 shrink-0 rounded-large" />
                    <Skeleton className="h-4 w-32 rounded-full" />
                </div>
                <Skeleton className="h-8 w-full rounded-full" />
            </div>
        ))}
    </div>
)

/** Loading skeleton — mirrors a job row (title/company + chip + button). */
const JobsSkeleton = () => (
    <div className="flex flex-col gap-3">
        {[0, 1, 2, 3].map((row) => (
            <div
                key={row}
                className="flex flex-wrap items-center gap-3 rounded-2xl border border-separator p-4"
            >
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <Skeleton className="h-4 w-44 rounded-full" />
                    <Skeleton className="h-3 w-28 rounded-full" />
                </div>
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-8 w-20 rounded-full" />
            </div>
        ))}
    </div>
)

/**
 * Career Center (§21) — skill graph + career roadmaps + jobs. FE-only mock shell:
 * three stacked sections on one page. Feature owns data (mock) + layout; tokens own
 * the look. Buttons are mock (no handlers yet). ponytail: hand-rolled sections.
 */
export const CareerCenter = () => {
    const t = useTranslations("careerCenter")
    const { skills, roadmaps, jobs, isLoading, error, mutate } = useQueryCareerSwr()
    const runRest = useRestWithToast()
    const { trigger: applyToJob, isMutating: isApplying } =
        usePostApplyCareerOpportunitySwr()
    const [applyingId, setApplyingId] = React.useState<string | null>(null)

    /** Apply to an opportunity via `POST /career/opportunities/{id}/apply` (toasted). */
    const onApply = React.useCallback(
        async (id: string) => {
            setApplyingId(id)
            await runRest(() => applyToJob({ id, request: {} }))
            setApplyingId(null)
        },
        [runRest, applyToJob],
    )

    return (
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
            <div className="flex flex-col gap-0">
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
                <AsyncContent
                    isLoading={isLoading && skills.length === 0}
                    skeleton={<SkillsSkeleton />}
                    isEmpty={skills.length === 0}
                    emptyContent={{ title: t("skillsEmpty") }}
                    error={skills.length === 0 ? error : undefined}
                    errorContent={{
                        title: t("loadError"),
                        onRetry: () => void mutate(),
                        retryLabel: t("retry"),
                    }}
                >
                    <div className="flex flex-col gap-4">
                        {skills.map((skill) => (
                            // labelled horizontal status bar (ui-polish-pass)
                            <ProgressMeter
                                key={skill.id}
                                value={Math.round(skill.progress)}
                                label={skill.name}
                                showValue
                            />
                        ))}
                    </div>
                </AsyncContent>
            </section>

            {/* career roadmaps */}
            <section className="flex flex-col gap-3 border-t border-separator pt-6">
                <Typography type="h6" weight="bold">
                    {t("roadmaps")}
                </Typography>
                <AsyncContent
                    isLoading={isLoading && roadmaps.length === 0}
                    skeleton={<RoadmapsSkeleton />}
                    isEmpty={roadmaps.length === 0}
                    emptyContent={{ title: t("roadmapsEmpty") }}
                    error={roadmaps.length === 0 ? error : undefined}
                    errorContent={{
                        title: t("loadError"),
                        onRetry: () => void mutate(),
                        retryLabel: t("retry"),
                    }}
                >
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {roadmaps.map((roadmap) => {
                            const Icon =
                                ROADMAP_ICON[roadmap.track.toLowerCase()] ?? BriefcaseIcon
                            return (
                                <div
                                    key={roadmap.id}
                                    className="flex flex-col gap-3 rounded-2xl border border-separator p-4 transition-colors hover:border-accent/40 hover:bg-default/40"
                                >
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="flex size-11 shrink-0 items-center justify-center rounded-large bg-accent/10 text-accent"
                                            aria-hidden
                                        >
                                            <Icon className="size-5" />
                                        </div>
                                        <Typography type="body-sm" weight="medium" className="min-w-0" truncate>
                                            {roadmap.title}
                                        </Typography>
                                    </div>
                                    <Button size="sm" variant="ghost">
                                        {t("viewRoadmap")}
                                    </Button>
                                </div>
                            )
                        })}
                    </div>
                </AsyncContent>
            </section>

            {/* jobs */}
            <section className="flex flex-col gap-3 border-t border-separator pt-6">
                <Typography type="h6" weight="bold">
                    {t("jobs")}
                </Typography>
                <AsyncContent
                    isLoading={isLoading && jobs.length === 0}
                    skeleton={<JobsSkeleton />}
                    isEmpty={jobs.length === 0}
                    emptyContent={{ title: t("jobsEmpty") }}
                    error={jobs.length === 0 ? error : undefined}
                    errorContent={{
                        title: t("loadError"),
                        onRetry: () => void mutate(),
                        retryLabel: t("retry"),
                    }}
                >
                    <div className="flex flex-col gap-3">
                        {jobs.map((job) => (
                            <div
                                key={job.id}
                                className="flex flex-wrap items-center gap-3 rounded-2xl border border-separator p-4 transition-colors hover:border-accent/40 hover:bg-default/40"
                            >
                                <div className="min-w-0 flex-1">
                                    <Typography type="body-sm" weight="medium" truncate>
                                        {job.title}
                                    </Typography>
                                    {job.company ? (
                                        <Typography type="body-xs" color="muted" className="truncate">
                                            {job.company}
                                        </Typography>
                                    ) : null}
                                </div>
                                <Chip size="sm" variant="soft" color="accent">
                                    {t(`jobTypes.${JOB_TYPE_KEY[job.type] ?? "fulltime"}`)}
                                </Chip>
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    isPending={isApplying && applyingId === job.id}
                                    isDisabled={isApplying}
                                    onPress={() => void onApply(job.id)}
                                >
                                    {t("apply")}
                                </Button>
                            </div>
                        ))}
                    </div>
                </AsyncContent>
            </section>
        </div>
    )
}
