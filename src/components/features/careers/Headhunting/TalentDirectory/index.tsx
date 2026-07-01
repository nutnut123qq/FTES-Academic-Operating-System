"use client"

import React from "react"
import { Skeleton, Typography } from "@heroui/react"
import { useLocale, useTranslations } from "next-intl"
import { UserAvatar } from "@/components/reuseable/UserAvatar"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { useQueryOpenToWorkUsersSwr } from "@/hooks/swr/api/graphql/queries/useQueryOpenToWorkUsersSwr"
import { pathConfig } from "@/resources/path"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { PageHeader } from "@/components/blocks/layout/PageHeader"
import { PressableCard } from "@/components/blocks/cards/PressableCard"

/** Number of placeholder cards shown while the directory loads. */
const SKELETON_COUNT = 6

/** Props for {@link TalentDirectory}. */
export type TalentDirectoryProps = WithClassNames<undefined>

/**
 * Talent directory — a grid of candidates who opted into "open to work", for
 * recruiters / headhunters to browse. Each card links to the candidate's public
 * profile. Self-contained container: reads the directory via SWR (public). MVP
 * shows the first page (newest first); pagination can be layered on later.
 *
 * @param props - {@link TalentDirectoryProps}
 */
export const TalentDirectory = ({ className }: TalentDirectoryProps) => {
    const t = useTranslations()
    const locale = useLocale()
    const {
        data,
        isLoading,
    } = useQueryOpenToWorkUsersSwr(0)
    const candidates = data ?? []

    return (
        <div className={className}>
            <div className="mx-auto flex max-w-5xl flex-col gap-6 p-6">
                <PageHeader
                    title={t("talents.title")}
                    description={t("talents.description")}
                />
                <AsyncContent
                    isLoading={isLoading && !data}
                    skeleton={(
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
                                <Skeleton key={index} className="h-28 w-full rounded-3xl" />
                            ))}
                        </div>
                    )}
                    isEmpty={candidates.length === 0}
                    emptyContent={{ title: t("talents.empty") }}
                >
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {candidates.map((candidate) => (
                            <PressableCard
                                key={candidate.id}
                                href={pathConfig().locale(locale).profile(candidate.username ?? "").build()}
                            >
                                <div className="flex flex-col gap-3">
                                    <div className="flex items-center gap-3">
                                        <UserAvatar
                                            username={candidate.displayName ?? candidate.username}
                                            avatar={candidate.avatar}
                                            seed={candidate.username}
                                            className="size-12"
                                        />
                                        <div className="flex min-w-0 flex-col gap-0">
                                            <Typography type="body-sm" weight="semibold" truncate>
                                                {candidate.displayName?.trim() ? candidate.displayName : candidate.username}
                                            </Typography>
                                            <Typography type="body-xs" color="muted" truncate>
                                                @{candidate.username}
                                            </Typography>
                                        </div>
                                    </div>
                                    {candidate.bio?.trim() ? (
                                        <Typography type="body-xs" color="muted" className="line-clamp-2">
                                            {candidate.bio}
                                        </Typography>
                                    ) : null}
                                </div>
                            </PressableCard>
                        ))}
                    </div>
                </AsyncContent>
            </div>
        </div>
    )
}
