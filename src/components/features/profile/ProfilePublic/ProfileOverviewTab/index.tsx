"use client"

import React from "react"
import { Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import {
    MedalIcon,
    StackIcon,
    UserPlusIcon,
    UsersThreeIcon,
} from "@phosphor-icons/react"
import { EmptyContent } from "@/components/blocks/async/EmptyContent"
import { LabeledCard } from "@/components/blocks/cards/LabeledCard"
import { MetricCard } from "@/components/blocks/stats/MetricCard"
import type { PublicProfile } from "../../hooks/useQueryPublicProfileSwr"
import { AchievementRow, ProjectCard } from "../ProfileEntries"

/** How many rows each overview preview block shows before deferring to its own tab. */
const PREVIEW_LIMIT = 3

/**
 * Overview tab — the profile's front page: the four counters that the BE can actually
 * back, the bio, and a short preview of projects + achievements (full lists live in the
 * Profile tab).
 *
 * Counters come from `counters` (followers/following are authoritative server totals) and
 * from the length of the `projects` / `achievements` arrays, which the public-profile
 * endpoint returns IN FULL — so those two are exact, not a page count.
 */
export const ProfileOverviewTab = ({
    profile,
    onSeeProjects,
}: {
    profile: PublicProfile
    /** Jumps to the Profile tab, where the full project + achievement lists render. */
    onSeeProjects: () => void
}) => {
    const t = useTranslations()

    // highlighted projects lead; fall back to the natural sort order when none are flagged
    const highlighted = profile.projects.filter((project) => project.highlighted)
    const previewProjects = (highlighted.length > 0 ? highlighted : profile.projects).slice(
        0,
        PREVIEW_LIMIT,
    )
    const previewAchievements = profile.achievements.slice(0, PREVIEW_LIMIT)

    return (
        <div className="flex flex-col gap-6">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <MetricCard
                    icon={<UsersThreeIcon className="size-5 text-accent" aria-hidden focusable="false" />}
                    value={profile.followers.toLocaleString()}
                    label={t("profile.community.connections.followers")}
                />
                <MetricCard
                    icon={<UserPlusIcon className="size-5 text-accent" aria-hidden focusable="false" />}
                    value={profile.following.toLocaleString()}
                    label={t("profile.community.connections.following")}
                />
                <MetricCard
                    icon={<StackIcon className="size-5 text-accent" aria-hidden focusable="false" />}
                    value={profile.projects.length.toLocaleString()}
                    label={t("publicProfile.stats.projects")}
                />
                <MetricCard
                    icon={<MedalIcon className="size-5 text-accent" aria-hidden focusable="false" />}
                    value={profile.achievements.length.toLocaleString()}
                    label={t("publicProfile.stats.achievements")}
                />
            </div>

            <LabeledCard label={t("profile.personal.about")}>
                {profile.about ? (
                    <Typography type="body-sm" color="muted" className="whitespace-pre-line">
                        {profile.about}
                    </Typography>
                ) : (
                    <EmptyContent title={t("publicProfile.about.empty")} />
                )}
            </LabeledCard>

            <LabeledCard
                label={t("profile.portfolio.projects")}
                frameless={previewProjects.length > 0}
                onSeeMore={profile.projects.length > PREVIEW_LIMIT ? onSeeProjects : undefined}
            >
                {previewProjects.length === 0 ? (
                    <EmptyContent title={t("profile.portfolio.empty.title")} />
                ) : (
                    <div className="flex flex-col gap-3">
                        {previewProjects.map((project) => (
                            <ProjectCard key={project.id} project={project} />
                        ))}
                    </div>
                )}
            </LabeledCard>

            <LabeledCard
                label={t("publicProfile.stats.achievements")}
                frameless={previewAchievements.length > 0}
                onSeeMore={profile.achievements.length > PREVIEW_LIMIT ? onSeeProjects : undefined}
            >
                {previewAchievements.length === 0 ? (
                    <EmptyContent title={t("profile.portfolio.achievements.empty")} />
                ) : (
                    <div className="flex flex-col gap-3">
                        {previewAchievements.map((achievement) => (
                            <AchievementRow key={achievement.id} achievement={achievement} />
                        ))}
                    </div>
                )}
            </LabeledCard>
        </div>
    )
}
