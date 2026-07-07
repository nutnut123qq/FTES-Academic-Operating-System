"use client"

import { Bell as BellIcon } from "@gravity-ui/icons"
import React from "react"
import {
    Badge,
    cn,
} from "@heroui/react"
import { truncate } from "lodash"
import { UserAvatar } from "@/components/reuseable/UserAvatar"
import { useAppSelector } from "@/redux/hooks"
import type { WithClassNames } from "@/modules/types/base/class-name"

/**
 * Props for {@link UserSummary}.
 */
export type UserSummaryProps = WithClassNames<undefined>

/**
 * Header panel for authenticated users: avatar, truncated username, email,
 * and a notification bell badge.
 *
 * Container: reads the authenticated user from the Redux store itself.
 * `"use client"` for the store selector hook.
 * @param props - optional root class name
 */
export const UserSummary = ({ className }: UserSummaryProps) => {
    const user = useAppSelector((state) => state.user.user)
    return (
        <div className={cn("flex items-center justify-between gap-6", className)}>
            <div className="flex items-center gap-2">
                <UserAvatar
                    className="cursor-pointer"
                    username={user?.username}
                    avatar={user?.avatar}
                    seed={user?.email ?? user?.username}
                />
                <div className="flex flex-col gap-0">
                    <div className="text-sm">
                        {truncate(user?.username, { length: 10 })}
                    </div>
                    <div className="text-xs text-muted">{user?.email}</div>
                </div>
            </div>
            <Badge size="sm" className="border-0" content="0" color="accent">
                <BellIcon className="size-6 text-divider" />
            </Badge>
        </div>
    )
}
