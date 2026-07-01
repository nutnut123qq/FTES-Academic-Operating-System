"use client"

import React from "react"
import {
    cn,
} from "@heroui/react"
import {
    useTranslations,
} from "next-intl"
import {
    RocketIcon,
} from "@phosphor-icons/react"
import {
    useProfileUsername,
} from "../../hooks/useProfileUsername"
import {
    ProjectCard,
} from "./ProjectCard"
import type {
    WithClassNames,
} from "@/modules/types/base/class-name"
import { useQueryUserCapstoneProgressSwr } from "@/hooks/swr/api/graphql/queries/useQueryUserCapstoneProgressSwr"
import { useQueryUserProfileSwr } from "@/hooks/swr/api/graphql/queries/useQueryUserProfileSwr"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { LabeledCard } from "@/components/blocks/cards/LabeledCard"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { SurfaceListCard, SurfaceListCardItem } from "@/components/blocks/cards/SurfaceListCard"

/** Props for {@link ProfileCapstone}. */
export type ProfileCapstoneProps = WithClassNames<undefined>

/**
 * Projects tab — the profile owner's verified capstone work, framed as
 * "project = one narrative showcase per course". Each personal-project capstone
 * course is one compact {@link ProjectCard} ROW inside a single
 * {@link LabeledCard} (label outside, content in one card — no nested card-in-card),
 * separated by dividers. Self-contained container: reads username → entity id,
 * then drives its own projection-backed SWR.
 *
 * @param props - optional className (placement only).
 */
export const ProfileCapstone = ({
    className,
}: ProfileCapstoneProps) => {
    const t = useTranslations()
    const username = useProfileUsername()
    const { data: user } = useQueryUserProfileSwr(username)
    const userId = user?.id ?? null
    const {
        data: projectsData,
        isLoading,
        error: projectsError,
        mutate: reloadProjects,
    } = useQueryUserCapstoneProgressSwr(userId)

    const projects = projectsData ?? []

    // resolved-empty + no error → hide the whole section (sparse profiles stay clean).
    if (projectsData && projects.length === 0 && !projectsError) {
        return null
    }

    return (
        <LabeledCard
            className={cn(className)}
            label={t("publicProfile.capstone.projectsHeading")}
            icon={<RocketIcon aria-hidden focusable="false" className="size-5" />}
            frameless
        >
            <AsyncContent
                isLoading={(isLoading || !userId) && !projectsData}
                skeleton={(
                    // mirror the real list: assume 3 capstone rows, Separator between
                    // each (like the content), each row = ProjectCard's tree
                    <SurfaceListCard>
                        {[0, 1, 2].map((row) => (
                            <SurfaceListCardItem key={row}>
                                <div className="flex flex-col gap-3">
                                    {/* glance row: icon tile + (title+chip+%) + bar + summary */}
                                    <div className="flex items-start gap-3">
                                        <Skeleton className="size-12 shrink-0 rounded-xl" />
                                        <div className="flex min-w-0 flex-1 flex-col gap-2">
                                            {/* title + verified chip + percent */}
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="flex min-w-0 flex-1 items-center gap-2">
                                                    <Skeleton.Typography type="body-sm" width="1/2" />
                                                    <Skeleton.Chip />
                                                </div>
                                                <Skeleton className="h-3 w-8 shrink-0 rounded" />
                                            </div>
                                            {/* verified-progress bar (SegmentBar, legend hidden) */}
                                            <Skeleton.ProgressBar />
                                            {/* roadmap summary line */}
                                            <Skeleton.Typography type="body-xs" width="2/3" />
                                        </div>
                                    </div>
                                    {/* "Xem milestone & task" disclosure Link */}
                                    <Skeleton.Typography type="body-sm" width="1/3" />
                                </div>
                            </SurfaceListCardItem>
                        ))}
                    </SurfaceListCard>
                )}
                isEmpty={projects.length === 0}
                error={projectsError}
                errorContent={{
                    title: t("publicProfile.capstone.loadErrorTitle"),
                    description: t("publicProfile.capstone.loadErrorDescription"),
                    onRetry: () => {
                        void reloadProjects()
                    },
                    retryLabel: t("publicProfile.capstone.loadErrorRetry"),
                }}
            >
                <SurfaceListCard>
                    {projects.map((project) => (
                        <SurfaceListCardItem key={project.courseGlobalId}>
                            <ProjectCard project={project} />
                        </SurfaceListCardItem>
                    ))}
                </SurfaceListCard>
            </AsyncContent>
        </LabeledCard>
    )
}
