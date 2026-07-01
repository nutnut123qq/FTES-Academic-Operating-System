"use client"

import React from "react"
import {
    cn,
    Skeleton,
} from "@heroui/react"
import {
    useTranslations,
} from "next-intl"
import {
    Rocket as RocketIcon,
} from "@gravity-ui/icons"
import {
    useProfileUsername,
} from "../useProfileUsername"
import {
    ProjectCard,
} from "./ProjectCard"
import {
    ChallengeChips,
} from "./ChallengeChips"
import type {
    WithClassNames,
} from "@/modules/types/base/class-name"
import { useQueryUserCapstoneProgressSwr } from "@/hooks/swr/api/graphql/queries/useQueryUserCapstoneProgressSwr"
import { useQueryUserProfileSwr } from "@/hooks/swr/api/graphql/queries/useQueryUserProfileSwr"
import { useQueryUserSolvedChallengesSwr } from "@/hooks/swr/api/graphql/queries/useQueryUserSolvedChallengesSwr"
import { SectionCard } from "@/components/reuseable/SectionCard"
import { EmptyState } from "@/components/blocks/feedback/EmptyState"
import { ErrorState } from "@/components/blocks/feedback/ErrorState"
import { StatusChip } from "@/components/blocks/chips/StatusChip"

/** Props for {@link ProfileCapstone}. */
export type ProfileCapstoneProps = WithClassNames<undefined>

/**
 * Projects tab — the profile owner's verified project work, framed as
 * "project = one narrative showcase; challenges = many". Each personal-project
 * capstone course becomes one showcase card (header + overall progress + milestone
 * roadmap + a milestone/task accordion). Solved challenges render below as a
 * compact counted chip grid. Self-contained container: reads the username → entity
 * id, then drives its own SWR (both projection-backed server-side).
 *
 * @param props - optional className for the root element.
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
    const { data: challengesData } = useQueryUserSolvedChallengesSwr(userId)

    // first load in flight (username not yet resolved, or query running) → a
    // skeleton that mirrors the showcase-card layout so the frame stays stable.
    if (!projectsData && (isLoading || !userId)) {
        return (
            <div className={cn("flex flex-col gap-6", className)}>
                <SectionCard
                    title={t("publicProfile.capstone.projectsHeading")}
                    icon={
                        <RocketIcon
                            className="size-5 text-accent"
                            aria-hidden="true"
                            focusable="false"
                        />
                    }
                >
                    <Skeleton className="h-24 w-full rounded-xl" />
                    <Skeleton className="h-24 w-full rounded-xl" />
                </SectionCard>
            </div>
        )
    }

    // load failed and we have nothing cached → recoverable error with retry.
    if (projectsError && !projectsData) {
        return (
            <div className={cn("flex flex-col gap-6", className)}>
                <SectionCard>
                    <ErrorState
                        title={t("publicProfile.capstone.loadErrorTitle")}
                        description={t("publicProfile.capstone.loadErrorDescription")}
                        retryLabel={t("publicProfile.capstone.loadErrorRetry")}
                        onRetry={() => {
                            void reloadProjects()
                        }}
                    />
                </SectionCard>
            </div>
        )
    }

    const projects = projectsData ?? []
    const solvedChallenges = challengesData ?? []
    // nothing verified yet in either bucket → single action-free empty state.
    if (projects.length === 0 && solvedChallenges.length === 0) {
        return (
            <div className={cn("flex flex-col gap-6", className)}>
                <SectionCard>
                    <EmptyState
                        icon={
                            <RocketIcon aria-hidden="true" focusable="false" />
                        }
                        title={t("publicProfile.capstoneEmpty")}
                    />
                </SectionCard>
            </div>
        )
    }

    return (
        <div className={cn("flex flex-col gap-6", className)}>
            {/* personal projects — one narrative showcase card per course */}
            {projects.length > 0 ? (
                <SectionCard
                    title={t("publicProfile.capstone.projectsHeading")}
                    icon={
                        <RocketIcon
                            className="size-5 text-accent"
                            aria-hidden="true"
                            focusable="false"
                        />
                    }
                >
                    {projects.map((project) => (
                        <ProjectCard
                            key={project.courseGlobalId}
                            project={project}
                        />
                    ))}
                </SectionCard>
            ) : null}

            {/* solved challenges — many graded exercises as a counted chip grid */}
            {solvedChallenges.length > 0 ? (
                <SectionCard
                    title={t("publicProfile.capstone.challengesHeading")}
                    action={
                        <StatusChip tone="success">
                            {t("publicProfile.capstone.challengesCount", { count: solvedChallenges.length })}
                        </StatusChip>
                    }
                >
                    <ChallengeChips challenges={solvedChallenges} />
                </SectionCard>
            ) : null}
        </div>
    )
}
