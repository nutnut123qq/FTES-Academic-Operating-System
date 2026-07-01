"use client"

import {
    UserMinusIcon,
    UserPlusIcon,
} from "@phosphor-icons/react"
import React from "react"
import {
    Button,
    Spinner,
} from "@heroui/react"
import {
    useTranslations,
} from "next-intl"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link FollowButton}. */
export interface FollowButtonProps extends WithClassNames<undefined> {
    /** Current follow state (owned by the parent). */
    following: boolean
    /** Invoked when the button is pressed; the parent runs the mutation. */
    onToggle?: () => void
    /** True while the parent's toggle request is in flight. */
    isPending?: boolean
}

/**
 * Reusable follow / unfollow toggle for another user.
 *
 * Presentational only: it renders the follow state and forwards presses to the
 * parent via `onToggle`. The parent (a layout container) owns the `setFollow`
 * mutation, the authoritative `following` value, and the in-flight `isPending`
 * flag — per the reuseable = no-store/no-fetch rule.
 *
 * @param props - {@link FollowButtonProps}
 */
export const FollowButton = ({
    following,
    onToggle,
    isPending = false,
    className,
}: FollowButtonProps) => {
    const t = useTranslations()

    return (
        <Button
            // "following" reads as a softer, already-engaged state
            variant={following ? "secondary" : "primary"}
            size="sm"
            isDisabled={isPending}
            onPress={onToggle}
            className={className}
        >
            {isPending ? (
                <Spinner
                    color="current"
                    size="sm"
                />
            ) : following ? (
                <UserMinusIcon className="size-4" />
            ) : (
                <UserPlusIcon className="size-4" />
            )}
            {following ? t("follow.following") : t("follow.follow")}
        </Button>
    )
}
