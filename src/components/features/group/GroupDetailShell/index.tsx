"use client"

import React, { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage, Button, Chip, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { usePathname, useRouter } from "@/i18n/navigation"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { useQueryGroupSwr } from "../hooks/useQueryGroupSwr"

/** Props for {@link GroupDetailShell}. */
interface GroupDetailShellProps {
    /** The `[groupId]` route segment. */
    groupId: string
    /** The active tab page. */
    children: React.ReactNode
}

/** Group tabs: i18n key + relative segment ("" = feed root). */
const TABS: Array<{ key: string; segment: string }> = [
    { key: "feed", segment: "" },
    { key: "discussion", segment: "discussion" },
    { key: "members", segment: "members" },
    { key: "resources", segment: "resources" },
    { key: "events", segment: "events" },
]

/**
 * Group detail shell (§7). Identity header (cover banner + avatar overlapping
 * the banner's bottom edge + name/type/members) over a tab nav (feed /
 * discussion / members / resources / events) and the active tab. The cover is
 * `aspect-[2/1]` on mobile, `aspect-[3/1]` from `sm`; when the group has no
 * cover (or it fails to load) an accent gradient stands in, and a missing
 * avatar falls back to the group's initial. ponytail: header + tabs
 * hand-rolled; tabs are nested routes; mock data.
 */
export const GroupDetailShell = ({ groupId, children }: GroupDetailShellProps) => {
    const t = useTranslations("groupsHub")
    const router = useRouter()
    const pathname = usePathname()
    const { group, isLoading } = useQueryGroupSwr(groupId)
    // cover URL that failed to load — compared against the current URL so the
    // error state self-resets when the group (and its cover) changes
    const [failedCoverUrl, setFailedCoverUrl] = useState<string | null>(null)

    const base = `/groups/${groupId}`
    const hrefFor = (segment: string) => (segment ? `${base}/${segment}` : base)
    const isActive = (segment: string) =>
        segment ? pathname.startsWith(`${base}/${segment}`) : pathname === base

    const coverShown = group?.coverUrl != null && group.coverUrl !== failedCoverUrl

    return (
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-6">
            {/* identity header — skeleton mirrors the exact geometry while loading */}
            {isLoading || !group ? (
                <div className="flex flex-col">
                    <Skeleton className="aspect-[2/1] w-full rounded-t-large sm:aspect-[3/1]" />
                    <div className="-mt-8 flex items-end gap-3 px-4 sm:-mt-10 sm:px-6">
                        <Skeleton.Avatar
                            size="lg"
                            className="size-16 shrink-0 ring-4 ring-background sm:size-20"
                        />
                        <div className="flex min-w-0 flex-1 flex-col pb-1">
                            <Skeleton.Typography type="h4" width="1/3" />
                            <Skeleton.Typography type="body-xs" width="1/4" />
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col">
                    {/* cover banner — image when set; decorative gradient when null or broken */}
                    {coverShown && group.coverUrl ? (
                        <img
                            src={group.coverUrl}
                            alt={t("identity.coverAlt", { name: group.name })}
                            className="aspect-[2/1] w-full rounded-t-large object-cover sm:aspect-[3/1]"
                            onError={() => setFailedCoverUrl(group.coverUrl)}
                        />
                    ) : (
                        <div
                            aria-hidden
                            className="aspect-[2/1] w-full rounded-t-large bg-gradient-to-r from-accent/20 to-accent/5 sm:aspect-[3/1]"
                        />
                    )}
                    {/* identity row — pulled up so the avatar overlaps the banner edge */}
                    <div className="-mt-8 flex items-end gap-3 px-4 sm:-mt-10 sm:px-6">
                        <Avatar className="size-16 shrink-0 ring-4 ring-background sm:size-20">
                            {group.avatarUrl ? (
                                <AvatarImage
                                    src={group.avatarUrl}
                                    alt={t("identity.avatarAlt", { name: group.name })}
                                />
                            ) : null}
                            <AvatarFallback className="bg-accent/10 text-lg font-bold text-accent">
                                {group.name.slice(0, 1).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1 pb-1">
                            <Typography type="h4" weight="bold" truncate>
                                {group.name}
                            </Typography>
                            <div className="mt-1 flex flex-wrap items-center gap-2">
                                <Chip size="sm" variant="soft" color="accent">
                                    {t(`types.${group.type}`)}
                                </Chip>
                                <Typography type="body-xs" color="muted">
                                    {t("membersCount", { count: group.members })}
                                </Typography>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* tab nav — static chrome, stays outside the skeleton */}
            <div className="flex flex-wrap gap-2 border-b border-separator pb-3">
                {TABS.map((tab) => (
                    <Button
                        key={tab.key}
                        size="sm"
                        variant={isActive(tab.segment) ? "secondary" : "ghost"}
                        onPress={() => router.push(hrefFor(tab.segment))}
                    >
                        {t(`tabs.${tab.key}`)}
                    </Button>
                ))}
            </div>

            <div>{children}</div>
        </div>
    )
}
