"use client"

import React, {
    useCallback,
} from "react"
import {
    Chip,
    Typography,
} from "@heroui/react"
import {
    FileTextIcon,
    ClockIcon,
    FireIcon,
    CaretRightIcon,
} from "@phosphor-icons/react"
import {
    useRouter,
} from "next/navigation"
import {
    useTranslations,
} from "next-intl"
import {
    pathConfig,
} from "@/resources/path"
import { IconTile } from "@/components/blocks/identity/IconTile"
import { SurfaceListCardRow } from "@/components/blocks/cards/SurfaceListCard"
import { type ContentEntity, getContentChallengeCount } from "@/modules/types/entities/content"
import { type WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link BookmarkCard} (list item — per-item content data only). */
export interface BookmarkCardProps extends WithClassNames<undefined> {
    /** Saved content entity rendered by this row. */
    content: ContentEntity
}

/**
 * One saved-content row inside the bookmark {@link SurfaceListCard}: a file icon,
 * the lesson title (the link — underlines on hover), the owning course as a
 * subtitle, and read-time / premium / challenge meta. The whole row navigates to
 * the content page (the title IS the link, so hover underlines it rather than
 * filling the row).
 *
 * List item: receives its own content entity and self-navigates via the router.
 * @param props - {@link BookmarkCardProps}
 */
export const BookmarkCard = ({
    content,
}: BookmarkCardProps) => {
    const t = useTranslations()
    const router = useRouter()
    const challengeCount = getContentChallengeCount(content)

    const onPress = useCallback(
        () => {
            if (content.displayId) {
                router.push(pathConfig().locale().publicContent(content.displayId).build())
            }
        },
        [
            content.displayId,
            router,
        ],
    )

    return (
        <SurfaceListCardRow
            hover="underline"
            onPress={onPress}
            leading={(
                <IconTile
                    size="sm"
                    tone="neutral"
                    src={content.module?.course?.coverImageUrl}
                    icon={<FileTextIcon />}
                    alt={content.title ?? ""}
                />
            )}
            title={content.title}
            subtitle={content.module?.course?.title}
            meta={(
                <>
                    {content.isPremium ? (
                        <Chip size="sm" variant="soft" color="warning">
                            <Chip.Label>{t("bookmarks.premium")}</Chip.Label>
                        </Chip>
                    ) : null}
                    <span className="flex items-center gap-1 text-muted">
                        <ClockIcon aria-hidden className="size-4" />
                        <Typography type="body-xs" color="muted">
                            {t("content.minutesRead", { minutes: content.minutesRead })}
                        </Typography>
                    </span>
                    {challengeCount > 0 ? (
                        <span className="flex items-center gap-1 text-muted">
                            <FireIcon aria-hidden className="size-4" />
                            <Typography type="body-xs" color="muted">
                                {challengeCount}
                            </Typography>
                        </span>
                    ) : null}
                </>
            )}
            trailing={<CaretRightIcon aria-hidden className="size-5 text-muted" />}
        />
    )
}
