"use client"

import React from "react"
import { UserCell } from "@/components/blocks/identity/UserCell"
import { useAppSelector } from "@/redux/hooks"
import type { WithClassNames } from "@/modules/types/base/class-name"

/**
 * Props for {@link UserSummary}.
 */
export type UserSummaryProps = WithClassNames<undefined>

/**
 * Header row for the account menu: the signed-in user's avatar + username +
 * email, rendered via the {@link UserCell} block (so it stays compact and matches
 * `Skeleton.UserCell`). Container: reads the user from redux.
 *
 * @param props - optional root class name (placement only)
 */
export const UserSummary = ({ className }: UserSummaryProps) => {
    const user = useAppSelector((state) => state.user.user)
    return (
        <UserCell
            className={className}
            username={user?.username ?? ""}
            avatar={user?.avatar}
            handle={user?.email ?? undefined}
        />
    )
}
