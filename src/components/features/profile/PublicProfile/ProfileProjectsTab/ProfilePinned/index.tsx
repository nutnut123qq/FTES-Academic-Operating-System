"use client"

import React from "react"
import { Button } from "@heroui/react"
import { useTranslations } from "next-intl"
import {
    PushPinIcon as PinIcon,
    PencilIcon,
} from "@phosphor-icons/react"
import { useProfileUsername } from "../../hooks/useProfileUsername"
import { PinnedProjectCard } from "./PinnedProjectCard"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { usePinnedProjectsOverlayState } from "@/hooks/zustand/overlay/hooks"
import { useQueryUserPinnedProjectsSwr } from "@/hooks/swr/api/graphql/queries/useQueryUserPinnedProjectsSwr"
import { useQueryUserProfileSwr } from "@/hooks/swr/api/graphql/queries/useQueryUserProfileSwr"
import { useAppSelector } from "@/redux/hooks"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { LabeledCard } from "@/components/blocks/cards/LabeledCard"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"

/** Props for {@link ProfilePinned}. */
export type ProfilePinnedProps = WithClassNames<undefined>

/**
 * Pinned projects card on the public profile — the user's hand-picked showcase
 * (verified course capstones + free-form external projects), GitHub-pinned-repos
 * style. Self-contained container: resolves the viewed user from the route, fetches
 * their pins via SWR, and renders one {@link PinnedProjectCard} per pin (verified
 * course pins get a "Verified by StarCi" chip; external pins link out).
 *
 * Owner-only: when the signed-in viewer owns this profile an "Add / manage"
 * action opens the manage modal (zustand overlay). Renders the empty state for
 * the owner (with an add CTA) but nothing at all for visitors with no pins, so a
 * stranger's profile stays clean.
 *
 * @param props - {@link ProfilePinnedProps}
 */
export const ProfilePinned = ({
    className,
}: ProfilePinnedProps) => {
    const t = useTranslations()
    const username = useProfileUsername()
    const viewer = useAppSelector((state) => state.user.user)
    const { data: user } = useQueryUserProfileSwr(username)
    const userId = user?.id ?? null
    const {
        data,
        isLoading,
        error,
        mutate,
    } = useQueryUserPinnedProjectsSwr(userId)
    // manage modal (owner only) — open-state lives in the shared zustand overlay
    const { open: openManage } = usePinnedProjectsOverlayState()

    // viewing your own profile → show the add/manage affordance + owner empty state
    const isSelf = !!viewer && !!userId && viewer.id === userId
    const pins = data ?? []

    // header action shown only to the owner WHEN there are pins (→ manage). The
    // empty state owns its own add CTA, so we don't repeat an add button up here.
    const action = isSelf && pins.length > 0 ? (
        <Button
            size="sm"
            variant="secondary"
            onPress={openManage}
        >
            <PencilIcon className="size-5" aria-hidden="true" focusable="false" />
            {t("pinnedProjects.manage")}
        </Button>
    ) : undefined

    // visitor viewing a profile with no pins and nothing loading/erroring → hide the
    // whole section (clean profile). Owners always keep the card (header + add CTA).
    if (!isSelf && !isLoading && !error && pins.length === 0) {
        return null
    }

    return (
        <LabeledCard
            frameless
            label={t("pinnedProjects.heading")}
            icon={<PinIcon className="size-5" aria-hidden="true" focusable="false" />}
            action={action}
            className={className}
        >
            <AsyncContent
                isLoading={isLoading && !data}
                skeleton={(
                    // mirror the responsive two-column pinned grid (bounded surface cards)
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {[0, 1, 2, 3].map((index) => (
                            <Skeleton key={index} className="h-32 w-full rounded-2xl" />
                        ))}
                    </div>
                )}
                isEmpty={pins.length === 0}
                // owner sees an add CTA; a visitor sees nothing (clean profile)
                emptyContent={isSelf ? {
                    title: t("pinnedProjects.emptyOwnerTitle"),
                    description: t("pinnedProjects.emptyOwnerDescription"),
                    onRetry: openManage,
                    retryLabel: t("pinnedProjects.add"),
                } : undefined}
                error={error}
                errorContent={{
                    title: t("pinnedProjects.errorTitle"),
                    description: t("pinnedProjects.errorDescription"),
                    onRetry: () => mutate(),
                    retryLabel: t("pinnedProjects.retry"),
                }}
            >
                {/* responsive two-column grid like GitHub pinned repos */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {pins.map((pin) => (
                        <PinnedProjectCard
                            key={pin.id}
                            pin={pin}
                        />
                    ))}
                </div>
            </AsyncContent>
        </LabeledCard>
    )
}
