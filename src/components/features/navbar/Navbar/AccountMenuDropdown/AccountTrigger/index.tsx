"use client"

import { UserIcon } from "@phosphor-icons/react"
import React, { useCallback } from "react"
import {
    Badge,
    Button,
    cn,
} from "@heroui/react"
import { useTranslations } from "next-intl"
import { UserAvatar } from "@/components/reuseable/UserAvatar"
import { useAppSelector } from "@/redux/hooks"
import { useGetMyStreakSwr } from "@/hooks/swr/api/rest/queries/useGetMyStreakSwr"
import { useAccountMenuOverlayState } from "@/hooks/zustand/overlay/hooks"
import type { WithClassNames } from "@/modules/types/base/class-name"

/**
 * Shortest streak the avatar badge bothers to show. A streak of 1 is not a
 * streak — it is "you opened the app today", which every signed-in learner hits
 * the moment they read a lesson, so a "1" would sit on nearly every avatar and
 * carry no information. The badge starts at the first day that required coming
 * back.
 */
const MIN_BADGE_STREAK = 2

/**
 * Props for {@link AccountTrigger}.
 */
export type AccountTriggerProps = WithClassNames<undefined>

/**
 * Dropdown trigger button shown in the navbar.
 *
 * Container: reads auth state + user from Redux and opens the account-menu
 * overlay itself. Renders a generic user icon for guests, or the avatar for
 * authenticated users — with the live learning streak badged on its corner once
 * it reaches {@link MIN_BADGE_STREAK} days. The streak is the real
 * `GET /gamification/me/streak` value, read through the shared
 * {@link useGetMyStreakSwr} key so the badge, the streak chip inside this very
 * dropdown and the profile surfaces can never disagree.
 * `"use client"` for store selectors + press handler.
 * @param props - optional root class name
 */
export const AccountTrigger = ({ className }: AccountTriggerProps) => {
    const t = useTranslations("nav")
    const isAuthenticated = useAppSelector((state) => state.keycloak.authenticated)
    const user = useAppSelector((state) => state.user.user)
    const { open } = useAccountMenuOverlayState()
    // Auth-gated inside the hook — guests key to `null`, so the navbar never fires
    // a `/me/*` request for a signed-out viewer. Signed in, the array key
    // `GET_MY_STREAK_SWR` is the SAME cache entry every other streak surface uses,
    // so mounting this in the navbar adds a request only on the pages that had no
    // streak reader at all.
    const { data: streak } = useGetMyStreakSwr()

    /** Open the account dropdown. */
    const onOpen = useCallback(() => open(), [open])

    if (!isAuthenticated) {
        return (
            <Button
                onPress={onOpen}
                isIconOnly
                className={cn("rounded-full", className)}
                variant="tertiary"
            >
                <UserIcon className="size-5" />
            </Button>
        )
    }

    const currentStreak = streak?.currentStreak ?? 0
    const showStreak = currentStreak >= MIN_BADGE_STREAK

    /* Accessible name for an icon-only button: it opens the account menu, and the
       streak only enters the name when the badge is actually on screen (otherwise
       a screen reader would announce a number nobody can see). */
    const accountMenuLabel = showStreak
        ? t("accountMenuWithStreak", { count: currentStreak })
        : t("accountMenu")

    /* No `seed` — it is deprecated (the generated face is gone) and it was the
       last place the account menu still keyed off the email. Built once so both
       branches render the identical avatar. */
    const avatar = (
        <UserAvatar
            size="sm"
            className="cursor-pointer"
            username={user?.username}
            avatar={user?.avatar}
        />
    )

    // No skeleton while the streak loads: the avatar is the trigger and renders
    // either way, so the badge simply appears once the value lands — the button's
    // box never moves.
    return (
        <Button
            onPress={onOpen}
            isIconOnly
            className={cn("rounded-full", className)}
            variant="tertiary"
            aria-label={accountMenuLabel}
        >
            {showStreak ? (
                /* The anchor stays bare here: `avatar--sm` is already the 32px box
                   the cart and bell anchors are pinned to, so the three navbar
                   badges land on the same corner (see
                   {@link import("../../CartButton").CartButton} for why those two
                   need pinning). Below the threshold the whole cluster is swapped for
                   a bare avatar rather than an anchor with no badge in it:
                   `badge-anchor` is a `relative inline-flex shrink-0` wrapper whose
                   only job is positioning a badge, so with nothing to position it is
                   just an extra box around the trigger. Badge box class list is
                   shared verbatim with the cart and bell badges. */
                <Badge.Anchor>
                    {avatar}
                    <Badge
                        size="sm"
                        color="accent"
                        className="h-4 min-w-4 items-center justify-center leading-4 tabular-nums"
                    >
                        {currentStreak}
                    </Badge>
                </Badge.Anchor>
            ) : (
                avatar
            )}
        </Button>
    )
}
