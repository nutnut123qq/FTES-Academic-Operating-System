"use client"

import React from "react"
import {
    Button,
    Skeleton,
} from "@heroui/react"
import { useTranslations } from "next-intl"
import {
    Pin as PinIcon,
    Plus as PlusIcon,
    Pencil as PencilIcon,
} from "@gravity-ui/icons"
import { useProfileUsername } from "../useProfileUsername"
import { PinnedProjectCard } from "./PinnedProjectCard"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { usePinnedProjectsOverlayState } from "@/hooks/zustand/overlay/hooks"
import { useQueryUserPinnedProjectsSwr } from "@/hooks/swr/api/graphql/queries/useQueryUserPinnedProjectsSwr"
import { useQueryUserProfileSwr } from "@/hooks/swr/api/graphql/queries/useQueryUserProfileSwr"
import { useAppSelector } from "@/redux/hooks"
import { EmptyState } from "@/components/blocks/feedback/EmptyState"
import { ErrorState } from "@/components/blocks/feedback/ErrorState"
import { SectionCard } from "@/components/reuseable/SectionCard"

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

    // manage / add action shown only to the owner
    const action = isSelf ? (
        <Button
            size="sm"
            variant="secondary"
            onPress={openManage}
        >
            {pins.length > 0 ? (
                <PencilIcon className="size-5" aria-hidden="true" focusable="false" />
            ) : (
                <PlusIcon className="size-5" aria-hidden="true" focusable="false" />
            )}
            {pins.length > 0 ? t("pinnedProjects.manage") : t("pinnedProjects.add")}
        </Button>
    ) : undefined

    // first load in flight → skeleton matching the two-column pinned grid
    if (isLoading && !data) {
        return (
            <SectionCard
                title={t("pinnedProjects.heading")}
                icon={<PinIcon className="size-5 text-accent" aria-hidden="true" focusable="false" />}
                className={className}
            >
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {[0, 1].map((index) => (
                        <Skeleton key={index} className="h-24 w-full rounded-xl" />
                    ))}
                </div>
            </SectionCard>
        )
    }

    // error → framed retry state (read errors otherwise show nothing for visitors)
    if (error) {
        return (
            <SectionCard
                title={t("pinnedProjects.heading")}
                icon={<PinIcon className="size-5 text-accent" aria-hidden="true" focusable="false" />}
                className={className}
            >
                <ErrorState
                    title={t("pinnedProjects.errorTitle")}
                    description={t("pinnedProjects.errorDescription")}
                    retryLabel={t("pinnedProjects.retry")}
                    onRetry={() => mutate()}
                />
            </SectionCard>
        )
    }

    // empty: owner sees an add CTA; a visitor sees nothing at all (clean profile)
    if (pins.length === 0) {
        if (!isSelf) {
            return null
        }
        return (
            <SectionCard
                title={t("pinnedProjects.heading")}
                icon={<PinIcon className="size-5 text-accent" aria-hidden="true" focusable="false" />}
                action={action}
                className={className}
            >
                <EmptyState
                    icon={<PinIcon />}
                    title={t("pinnedProjects.emptyOwnerTitle")}
                    description={t("pinnedProjects.emptyOwnerDescription")}
                    action={(
                        <Button
                            size="sm"
                            variant="primary"
                            onPress={openManage}
                        >
                            <PlusIcon className="size-5" aria-hidden="true" focusable="false" />
                            {t("pinnedProjects.add")}
                        </Button>
                    )}
                />
            </SectionCard>
        )
    }

    return (
        <SectionCard
            title={t("pinnedProjects.heading")}
            icon={<PinIcon className="size-5 text-accent" aria-hidden="true" focusable="false" />}
            action={action}
            className={className}
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
        </SectionCard>
    )
}
