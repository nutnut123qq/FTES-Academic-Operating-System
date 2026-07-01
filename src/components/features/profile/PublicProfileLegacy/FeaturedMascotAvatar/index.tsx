"use client"

import React from "react"
import {
    Button,
    cn,
    Popover,
    Spinner,
    Typography,
} from "@heroui/react"
import {
    useTranslations,
} from "next-intl"
import {
    Plus as PlusIcon,
    Xmark as XmarkIcon,
} from "@gravity-ui/icons"
import {
    useProfileUsername,
} from "../useProfileUsername"
import type {
    WithClassNames,
} from "@/modules/types/base/class-name"
import { useAppSelector } from "@/redux/hooks"
import { useMutateUpdateProfileSwr } from "@/hooks/swr/api/graphql/mutations/useMutateUpdateProfileSwr"
import { useQueryUserAchievementsSwr } from "@/hooks/swr/api/graphql/queries/useQueryUserAchievementsSwr"
import { useQueryUserProfileSwr } from "@/hooks/swr/api/graphql/queries/useQueryUserProfileSwr"
import { MascotBadge } from "@/components/reuseable/MascotBadge"
import { UserAvatar } from "@/components/reuseable/UserAvatar"
import { getRank } from "@/modules/utils/rank"

/** Props for {@link FeaturedMascotAvatar}. */
export type FeaturedMascotAvatarProps = WithClassNames<undefined>

/**
 * The profile avatar framed by the user's pinned mascot: the featured
 * achievement's rank colour rings the avatar, and the mascot itself sits as a
 * corner badge. The owner can click the corner to pick from their earned mascots
 * (or clear it); when nothing is pinned yet the owner sees a "+" affordance.
 *
 * Self-contained container: resolves the target user from the route, reads the
 * profile + achievement wall via SWR (deduped with the rest of the page), and
 * owns the pin mutation. Viewers other than the owner only see the framed avatar.
 *
 * @param props - optional className for the root element.
 */
export const FeaturedMascotAvatar = ({
    className,
}: FeaturedMascotAvatarProps) => {
    const t = useTranslations()
    const username = useProfileUsername()
    const {
        data: user,
        mutate: mutateProfile,
    } = useQueryUserProfileSwr(username)
    const userId = user?.id ?? null
    const viewer = useAppSelector((state) => state.user.user)
    const isSelf = !!viewer && !!userId && viewer.id === userId
    const { data: achievements } = useQueryUserAchievementsSwr(userId)
    const {
        trigger,
        isMutating,
    } = useMutateUpdateProfileSwr()

    // resolve the pinned slug to its earned wall entry (ring colour + art come
    // from there); only an *earned* badge is honoured as the frame
    const featuredSlug = user?.featuredAchievementSlug ?? null
    const featured = (achievements ?? []).find(
        (item) => item.slug === featuredSlug && item.earned,
    ) ?? null
    const ring = featured ? getRank(true, featured.tierReached).ring : null
    // only earned mascots are pinnable
    const earned = (achievements ?? []).filter((item) => item.earned)

    /** Pin a mascot (or clear with null), then revalidate the profile. */
    const choose = async (slug: string | null) => {
        await trigger({
            featuredAchievementSlug: slug,
        })
        await mutateProfile?.()
    }

    if (!user) {
        return null
    }

    // the framed avatar (shared by owner + viewers); the colour ring is the pin's
    // rank. The ring is drawn via inline padding + the dynamic rank colour (a hex,
    // not a token) so we keep off the static spacing scale here.
    const avatar = (
        <div
            className="w-fit rounded-2xl"
            style={ring ? { backgroundColor: ring, padding: 4 } : undefined}
        >
            <UserAvatar
                username={user.displayName ?? user.username}
                avatar={user.avatar}
                seed={user.username}
                size="lg"
                className="size-32 rounded-xl"
            />
        </div>
    )

    return (
        <div className={cn("relative w-fit", className)}>
            {avatar}
            {/* corner: the pinned mascot (everyone) or a picker trigger (owner) */}
            {isSelf ? (
                <Popover>
                    <Popover.Trigger>
                        <button
                            type="button"
                            aria-label={t("profileMascot.pick")}
                            className="absolute -bottom-1 -right-1 flex size-11 items-center justify-center rounded-full border-2 border-background bg-default/60 text-muted transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                        >
                            {featured ? (
                                <MascotBadge
                                    objectKey={featured.iconKey}
                                    name={featured.name}
                                    earned
                                    tierReached={featured.tierReached}
                                    size={44}
                                />
                            ) : (
                                <PlusIcon aria-hidden focusable="false" className="size-5" />
                            )}
                        </button>
                    </Popover.Trigger>
                    <Popover.Content className="flex w-72 flex-col gap-3 p-3">
                        <div className="flex items-center justify-between gap-2">
                            <Typography type="body-sm" weight="semibold">
                                {t("profileMascot.pick")}
                            </Typography>
                            {isMutating ? <Spinner size="sm" /> : null}
                        </div>
                        {earned.length === 0 ? (
                            <Typography type="body-xs" color="muted" align="center">
                                {t("profileMascot.empty")}
                            </Typography>
                        ) : (
                            <div className="grid grid-cols-4 gap-3">
                                {earned.map((item) => (
                                    <button
                                        key={item.slug}
                                        type="button"
                                        aria-label={item.name}
                                        onClick={() => choose(item.slug)}
                                        className={cn(
                                            "flex items-center justify-center rounded-xl p-2 transition-colors hover:bg-default/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                                            item.slug === featuredSlug && "bg-default/60",
                                        )}
                                    >
                                        <MascotBadge
                                            objectKey={item.iconKey}
                                            name={item.name}
                                            earned
                                            tierReached={item.tierReached}
                                            size={48}
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                        {featured ? (
                            <Button
                                size="sm"
                                variant="secondary"
                                className="w-full"
                                onPress={() => choose(null)}
                            >
                                <XmarkIcon aria-hidden focusable="false" className="size-5" />
                                {t("profileMascot.clear")}
                            </Button>
                        ) : null}
                    </Popover.Content>
                </Popover>
            ) : featured ? (
                <div className="absolute -bottom-1 -right-1">
                    <MascotBadge
                        objectKey={featured.iconKey}
                        name={featured.name}
                        earned
                        tierReached={featured.tierReached}
                        size={44}
                    />
                </div>
            ) : null}
        </div>
    )
}
