"use client"

import React from "react"
import { cn } from "@heroui/react"
import { CaretRightIcon } from "@phosphor-icons/react"
import { Link } from "@/i18n/navigation"
import { UserAvatar } from "@/components/reuseable/UserAvatar"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { useQueryOverviewIdentitySwr } from "../../../hooks/useQueryOverviewIdentitySwr"

/** Props for {@link ProfileMenuCard}. */
export type ProfileMenuCardProps = WithClassNames<undefined>

/**
 * The dashboard rail's identity row: avatar + display name + @handle on the left,
 * with a trailing caret. The whole row is a link to the viewer's profile. No level,
 * no XP — the identity anchor is intentionally quiet (mirrors StarCI). Self-fetches
 * its own mock identity leaf query.
 * @param props - optional className merged onto the row.
 */
export const ProfileMenuCard = ({ className }: ProfileMenuCardProps) => {
    const { data, isLoading, error, mutate } = useQueryOverviewIdentitySwr()

    return (
        <AsyncContent
            isLoading={isLoading || !data}
            error={!data ? error : undefined}
            skeleton={(
                <div className={cn("flex items-center gap-3", className)}>
                    <Skeleton.Avatar size="lg" />
                    <div className="flex min-w-0 flex-1 flex-col gap-2">
                        <Skeleton.Typography type="body-sm" width="1/2" />
                        <Skeleton.Typography type="body-xs" width="1/3" />
                    </div>
                </div>
            )}
        >
            {data ? (
                <Link
                    href="/profile"
                    className={cn(
                        "flex cursor-pointer items-center justify-between gap-3 no-underline transition-opacity hover:opacity-60",
                        className,
                    )}
                >
                    <div className="flex min-w-0 items-center gap-3">
                        <UserAvatar
                            className="size-10"
                            username={data.name}
                            avatar={data.avatar}
                            seed={data.username}
                            size="lg"
                        />
                        <div className="flex min-w-0 flex-col">
                            <span className="truncate text-sm font-semibold text-foreground">
                                {data.name}
                            </span>
                            <span className="truncate text-xs text-muted">
                                @{data.username}
                            </span>
                        </div>
                    </div>
                    <CaretRightIcon
                        aria-hidden
                        focusable="false"
                        className="size-5 shrink-0 text-muted"
                    />
                </Link>
            ) : null}
        </AsyncContent>
    )
}
