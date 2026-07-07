"use client"

import React, { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage, Button, Chip, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { useQueryGroupsSwr, type GroupType } from "../hooks/useQueryGroupsSwr"

/** Loading skeleton — mirrors the group card grid (avatar + text lines). */
const GroupsListSkeleton = () => (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex flex-col gap-2 rounded-2xl border border-separator p-4">
                <div className="flex items-center gap-2">
                    <Skeleton.Avatar size="md" className="shrink-0" />
                    <Skeleton.Typography type="body" width="1/2" />
                </div>
                <Skeleton.Typography type="body-sm" width="full" />
                <Skeleton.Typography type="body-xs" width="1/4" />
            </div>
        ))}
    </div>
)

/** Filter options: "all" + every group type. */
const TYPES: Array<GroupType | "all"> = ["all", "public", "private", "study", "club", "team"]

/**
 * Groups list (§7). DEFAULT on-canon layout: a type filter + a grid of group
 * cards linking to each group. Each card leads with the group avatar (image
 * when set, initials tile fallback otherwise — same size, so the row never
 * shifts). ponytail: cards hand-rolled; mock data.
 */
export const GroupsList = () => {
    const t = useTranslations("groupsHub")
    const { groups, isLoading, error, mutate } = useQueryGroupsSwr()
    const [type, setType] = useState<GroupType | "all">("all")

    const filtered = type === "all" ? groups : groups.filter((group) => group.type === type)

    return (
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-6">
            <Typography type="h4" weight="bold">
                {t("title")}
            </Typography>

            {/* type filter — static chrome, stays outside the skeleton */}
            <div className="flex flex-wrap gap-2">
                {TYPES.map((option) => (
                    <Button
                        key={option}
                        size="sm"
                        variant={type === option ? "secondary" : "ghost"}
                        onPress={() => setType(option)}
                    >
                        {option === "all" ? t("all") : t(`types.${option}`)}
                    </Button>
                ))}
            </div>

            <AsyncContent
                isLoading={isLoading && groups.length === 0}
                skeleton={<GroupsListSkeleton />}
                isEmpty={filtered.length === 0}
                emptyContent={{ title: t("groupsList.empty") }}
                error={groups.length === 0 ? error : undefined}
                errorContent={{
                    title: t("groupsList.error"),
                    onRetry: () => void mutate(),
                    retryLabel: t("states.retry"),
                }}
            >
                {/* group grid */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {filtered.map((group) => (
                        <Link
                            key={group.id}
                            href={`/groups/${group.id}`}
                            className="flex flex-col gap-2 rounded-2xl border border-separator p-4 no-underline transition-colors hover:bg-default/40"
                        >
                            <div className="flex items-center gap-2">
                                {/* group avatar — image when set; initials fallback also
                                    covers a broken URL (HeroUI Avatar only mounts the img
                                    once it loads, so errors fall back, no broken glyph) */}
                                <Avatar size="md" className="shrink-0">
                                    {group.avatarUrl ? (
                                        <AvatarImage
                                            src={group.avatarUrl}
                                            alt={t("identity.avatarAlt", { name: group.name })}
                                        />
                                    ) : null}
                                    <AvatarFallback className="bg-accent/10 font-bold text-accent">
                                        {group.name.slice(0, 1).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <Typography type="body" weight="medium" className="min-w-0 flex-1" truncate>
                                    {group.name}
                                </Typography>
                                <Chip size="sm" variant="soft" color="accent">
                                    {t(`types.${group.type}`)}
                                </Chip>
                            </div>
                            <Typography type="body-sm" color="muted">
                                {group.description}
                            </Typography>
                            <Typography type="body-xs" color="muted">
                                {t("membersCount", { count: group.members })}
                            </Typography>
                        </Link>
                    ))}
                </div>
            </AsyncContent>
        </div>
    )
}
