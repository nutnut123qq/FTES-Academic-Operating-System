"use client"

import React from "react"
import { Chip, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import { useQueryPublicProfileSwr } from "../hooks/useQueryPublicProfileSwr"

/**
 * Public (read-only) profile view (§2). DEFAULT on-canon layout: an identity
 * header + about + skill chips + a follower count. Standalone (not under the
 * owner-scoped profile shell) so its nav never points at the viewer's own pages.
 * ponytail: hand-rolled; mock data by username.
 */
export const ProfilePublic = () => {
    const t = useTranslations("profile")
    const { username } = useParams<{ username: string }>()
    const { profile } = useQueryPublicProfileSwr(username)

    if (!profile) {
        return null
    }

    return (
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6">
            {/* identity header */}
            <div className="flex items-center gap-4 rounded-large border border-separator p-6">
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
            <div className="flex flex-col gap-2">
                <Typography type="h6" weight="bold">
                    {t("personal.about")}
                </Typography>
                <Typography type="body-sm" color="muted">
                    {profile.about}
                </Typography>
            </div>

            {/* skills */}
            <div className="flex flex-col gap-3 border-t border-separator pt-6">
                <Typography type="h6" weight="bold">
                    {t("public.skills")}
                </Typography>
                <div className="flex flex-wrap gap-2">
                    {profile.skills.map((skill) => (
                        <Chip key={skill} size="sm" variant="soft" color="accent">
                            {skill}
                        </Chip>
                    ))}
                </div>
            </div>
        </div>
    )
}
