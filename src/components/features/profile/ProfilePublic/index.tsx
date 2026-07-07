"use client"

import React from "react"
import { Chip, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { EmptyContent } from "@/components/blocks/async/EmptyContent"
import { LabeledCard } from "@/components/blocks/cards/LabeledCard"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { useQueryPublicProfileSwr } from "../hooks/useQueryPublicProfileSwr"

/** Skeleton mirroring the public profile identity header + about + skills. */
const PublicProfileSkeleton = () => (
    <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4 rounded-2xl border border-separator p-6">
            <Skeleton.Avatar size="lg" className="size-16" />
            <div className="flex min-w-0 flex-1 flex-col gap-2">
                <Skeleton.Typography type="h4" width="1/2" />
                <Skeleton.Typography type="body-sm" width="2/3" />
                <Skeleton.Typography type="body-xs" width="1/3" />
            </div>
        </div>
        <div className="flex flex-col gap-3">
            <Skeleton.Typography type="h6" width="1/4" />
            <Skeleton.Card lines={3} />
        </div>
        <div className="flex flex-col gap-3">
            <Skeleton.Typography type="h6" width="1/4" />
            <div className="flex flex-wrap gap-2">
                <Skeleton.Chip />
                <Skeleton.Chip />
                <Skeleton.Chip />
            </div>
        </div>
    </div>
)

/**
 * Public (read-only) profile view (§2). DEFAULT on-canon layout: an identity
 * header + about + skill chips + a follower count, built with the same house
 * blocks (LabeledCard / AsyncContent) as the owner-scoped sections so the two
 * profile surfaces read as one. Standalone (not under the owner shell) so its
 * nav never points at the viewer's own pages.
 * ponytail: hand-rolled identity header; mock data by username.
 */
export const ProfilePublic = () => {
    const t = useTranslations("profile")
    const { username } = useParams<{ username: string }>()
    const { profile, isLoading, error, mutate } = useQueryPublicProfileSwr(username)

    return (
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6">
            <AsyncContent
                isLoading={isLoading && !profile}
                skeleton={<PublicProfileSkeleton />}
                error={!profile ? error : undefined}
                errorContent={{
                    title: t("loadingError"),
                    retryLabel: t("retry"),
                    onRetry: () => void mutate(),
                }}
            >
                {profile ? (
                    <div className="flex flex-col gap-6">
                        {/* identity header */}
                        <div className="flex items-center gap-4 rounded-2xl border border-separator p-6">
                            <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-accent/10 text-xl font-bold text-accent">
                                {profile.name.slice(0, 1).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                                <Typography type="h4" weight="bold" truncate>
                                    {profile.name}
                                </Typography>
                                <Typography type="body-sm" color="muted">
                                    @{profile.username} · {profile.headline}
                                </Typography>
                                <Typography type="body-xs" color="muted">
                                    {t("public.followers", { count: profile.followers })} · {profile.campus}
                                </Typography>
                            </div>
                        </div>

                        {/* about */}
                        <LabeledCard label={t("personal.about")}>
                            {profile.about ? (
                                <Typography type="body-sm" color="muted">
                                    {profile.about}
                                </Typography>
                            ) : (
                                <EmptyContent title={t("personal.empty.aboutTitle")} />
                            )}
                        </LabeledCard>

                        {/* skills */}
                        <LabeledCard label={t("public.skills")}>
                            {profile.skills.length === 0 ? (
                                <EmptyContent title={t("public.emptySkills")} />
                            ) : (
                                <div className="flex flex-wrap gap-2">
                                    {profile.skills.map((skill) => (
                                        <Chip key={skill} size="sm" variant="soft" color="accent">
                                            {skill}
                                        </Chip>
                                    ))}
                                </div>
                            )}
                        </LabeledCard>
                    </div>
                ) : null}
            </AsyncContent>
        </div>
    )
}
