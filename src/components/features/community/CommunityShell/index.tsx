"use client"

import React, { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage, Button, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { usePathname, useRouter } from "@/i18n/navigation"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { useQueryCommunityIdentitySwr } from "../hooks/useQueryCommunityIdentitySwr"

/** Props for {@link CommunityShell}. */
interface CommunityShellProps {
    /** The active feed scope page. */
    children: React.ReactNode
}

/** Feed scope tabs: i18n key + relative segment ("" = For You root). */
const TABS: Array<{ key: string; segment: string }> = [
    { key: "forYou", segment: "" },
    { key: "following", segment: "following" },
    { key: "campus", segment: "campus" },
    { key: "trending", segment: "trending" },
]

/**
 * Community shell (§6). Identity header (shallow cover banner `aspect-[4/1]`
 * mobile / `aspect-[5/1]` from `sm` + community avatar + title, mocked via
 * `useQueryCommunityIdentitySwr`) over a scope tab nav (For You / Following /
 * Campus / Trending) and the active feed. Identity is HUB-level only — scopes
 * are route segments, no per-scope banner. Missing/broken cover falls back to
 * an accent gradient; missing avatar falls back to initials. ponytail: tab row
 * hand-rolled (Buttons); scopes are nested routes; mock data.
 */
export const CommunityShell = ({ children }: CommunityShellProps) => {
    const t = useTranslations("communityHub")
    const router = useRouter()
    const pathname = usePathname()
    const { identity, isLoading } = useQueryCommunityIdentitySwr()
    // cover URL that failed to load — compared against the current URL so the
    // error state self-resets if the identity (and its cover) changes
    const [failedCoverUrl, setFailedCoverUrl] = useState<string | null>(null)

    const base = "/community"
    const hrefFor = (segment: string) => (segment ? `${base}/${segment}` : base)
    const isActive = (segment: string) =>
        segment ? pathname.startsWith(`${base}/${segment}`) : pathname === base

    const coverShown = identity?.coverUrl != null && identity.coverUrl !== failedCoverUrl

    return (
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6">
            {/* identity header — skeleton mirrors the exact geometry while loading */}
            {isLoading || !identity ? (
                <div className="flex flex-col">
                    <Skeleton className="aspect-[4/1] w-full rounded-large sm:aspect-[5/1]" />
                    <div className="-mt-6 flex items-end gap-3 px-4">
                        <Skeleton.Avatar size="lg" className="shrink-0 ring-4 ring-background" />
                        <div className="min-w-0 flex-1 pb-1">
                            <Skeleton.Typography type="h4" width="1/3" />
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col">
                    {/* cover banner — image when set; decorative gradient when null or broken */}
                    {coverShown && identity.coverUrl ? (
                        <img
                            src={identity.coverUrl}
                            alt={t("identity.coverAlt", { name: identity.name })}
                            className="aspect-[4/1] w-full rounded-large object-cover sm:aspect-[5/1]"
                            onError={() => setFailedCoverUrl(identity.coverUrl)}
                        />
                    ) : (
                        <div
                            aria-hidden
                            className="aspect-[4/1] w-full rounded-large bg-gradient-to-r from-accent/20 to-accent/5 sm:aspect-[5/1]"
                        />
                    )}
                    {/* identity row — avatar pulled up over the banner edge */}
                    <div className="-mt-6 flex items-end gap-3 px-4">
                        <Avatar size="lg" className="shrink-0 ring-4 ring-background">
                            {identity.avatarUrl ? (
                                <AvatarImage
                                    src={identity.avatarUrl}
                                    alt={t("identity.avatarAlt", { name: identity.name })}
                                />
                            ) : null}
                            <AvatarFallback className="bg-accent/10 font-bold text-accent">
                                {identity.name.slice(0, 1).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1 pb-1">
                            <Typography type="h4" weight="bold" truncate>
                                {identity.name}
                            </Typography>
                        </div>
                    </div>
                </div>
            )}

            {/* scope tab nav — static chrome, stays outside the skeleton */}
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
