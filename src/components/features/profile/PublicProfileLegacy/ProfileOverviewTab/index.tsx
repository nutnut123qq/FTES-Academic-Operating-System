"use client"

import React from "react"
import {
    Button,
    Typography,
    cn,
} from "@heroui/react"
import {
    useLocale,
    useTranslations,
} from "next-intl"
import {
    useRouter,
} from "next/navigation"
import {
    useProfileUsername,
} from "../useProfileUsername"
import type {
    WithClassNames,
} from "@/modules/types/base/class-name"
import {
    ProfileContributions,
} from "../ProfileContributions"
import {
    ProfileFeaturedProjects,
} from "../ProfileFeaturedProjects"
import {
    ProfileSkillsSnapshot,
} from "../ProfileSkillsSnapshot"
import { useAppSelector } from "@/redux/hooks"
import { useQueryUserProfileSwr } from "@/hooks/swr/api/graphql/queries/useQueryUserProfileSwr"
import { pathConfig } from "@/resources/path"
import { MarkdownContent } from "@/components/reuseable/MarkdownContent"
import { SectionCard } from "@/components/reuseable/SectionCard"

/** Props for {@link ProfileOverviewTab}. */
export type ProfileOverviewTabProps = WithClassNames<undefined>

/**
 * Overview-tab body of the public profile — the GitHub-style "front page".
 *
 * Renders exactly 4 blocks, top to bottom, gap-6 (each self-hides when empty):
 *  1. Bio SectionCard — README-style markdown intro (isSelf + empty → "write bio" CTA)
 *  2. {@link ProfileFeaturedProjects} — the sole "Dự án" block: pinned → verified capstone → in-progress
 *  3. Contribution SectionCard wrapping {@link ProfileContributions} heatmap + streak
 *  4. {@link ProfileSkillsSnapshot} — top 3-4 skills snapshot with "Xem tất cả →"
 *
 * Self-fetches the viewed user (for the bio + `isSelf` check) from the route
 * username, so it takes no data props; it is mounted only when the Overview tab
 * is open (lazy fetch).
 *
 * @param props - {@link ProfileOverviewTabProps}
 */
export const ProfileOverviewTab = ({
    className,
}: ProfileOverviewTabProps) => {
    const t = useTranslations()
    const router = useRouter()
    const locale = useLocale()
    // target username: the `/profile/[username]` segment, or — on the bare
    // `/profile` — the signed-in user's own username (one layout for self + others)
    const username = useProfileUsername()
    const viewer = useAppSelector((state) => state.user.user)
    const { data: user } = useQueryUserProfileSwr(username)

    // entity id resolved from the username — what isSelf keys off
    const targetUserId = user?.id ?? null
    // viewing your own public profile → offer the "write bio" shortcut
    const isSelf = !!viewer && !!targetUserId && viewer.id === targetUserId

    // bio block is visible to the owner always (so they can write one),
    // and to guests only when there is actual content — self-hides when empty for guests
    const hasBio = Boolean(user?.bio?.trim())
    const showBioBlock = isSelf || hasBio

    return (
        <div className={cn("flex min-w-0 flex-1 flex-col gap-6", className)}>
            {/* 1. README-style bio — hidden for guests when empty */}
            {showBioBlock ? (
                <SectionCard
                    title={t("publicProfile.bioHeading")}
                    action={isSelf && !hasBio ? (
                        <Button
                            size="sm"
                            variant="secondary"
                            onPress={() => router.push(pathConfig().locale(locale).profile().edit().build())}
                        >
                            {t("publicProfile.bioWrite")}
                        </Button>
                    ) : undefined}
                >
                    {hasBio ? (
                        <MarkdownContent markdown={user!.bio!} />
                    ) : (
                        // owner only: prompt to fill in bio
                        <Typography type="body-sm" color="muted">
                            {t("publicProfile.bioEmpty")}
                        </Typography>
                    )}
                </SectionCard>
            ) : null}

            {/* 2. Dự án — single state-aware block (pinned → verified → in-progress) */}
            <ProfileFeaturedProjects />

            {/* 3. contribution heatmap + streak — consistency proof */}
            <SectionCard contentClassName="gap-0">
                <ProfileContributions />
            </SectionCard>

            {/* 4. skills snapshot — top 3-4 by depth, "Xem tất cả →" tab */}
            <ProfileSkillsSnapshot />
        </div>
    )
}
