"use client"

import React from "react"
import {
    useLocale,
    useTranslations,
} from "next-intl"
import {
    Typography,
    cn,
} from "@heroui/react"
import {
    ChangelogListSkeleton,
} from "./ChangelogListSkeleton"
import type {
    WithClassNames,
} from "@/modules/types/base/class-name"
import { useQueryChangelogEntriesSwr } from "@/hooks/swr/api/graphql/queries/useQueryChangelogEntriesSwr"
import { ChangelogCategory } from "@/modules/api/graphql/queries/types/changelog-entries"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { LabeledCard } from "@/components/blocks/cards/LabeledCard"
import { SurfaceListCard, SurfaceListCardItem } from "@/components/blocks/cards/SurfaceListCard"

/** Props for {@link ChangelogList}. */
export interface ChangelogListProps extends WithClassNames<undefined> {
    /**
     * When true, render inside a `LabeledCard` (title as a Label OUTSIDE the card) —
     * used on the dashboard Overview tab. Defaults to the flat heading + list.
     */
    framed?: boolean
}

/** Tailwind classes for each category chip. */
const CATEGORY_CLASS: Record<ChangelogCategory, string> = {
    [ChangelogCategory.Feature]: "bg-success/15 text-success",
    [ChangelogCategory.Fix]: "bg-warning/15 text-warning",
    [ChangelogCategory.Announcement]: "bg-secondary/15 text-secondary",
}

/**
 * GitHub-style "Latest from our changelog" list for the dashboard right rail.
 * Each row shows the published date, an optional colored category chip and the
 * title (linked when the entry has a destination). Self-fetches the recent
 * changelog entries (newest first) like every other sidebar block.
 * @param props - optional className for the root element
 */
export const ChangelogList = ({
    className,
    framed = false,
}: ChangelogListProps = {}) => {
    const t = useTranslations()
    const locale = useLocale()
    const { data: changelog, isLoading } = useQueryChangelogEntriesSwr()
    const entries = changelog ?? []

    // loaded + empty → hide the whole block (label/frame included); loading shows the skeleton
    if (!isLoading && entries.length === 0) {
        return null
    }

    /** The dated changelog rows as ONE surface list card (heading-free). */
    const list = (
        <SurfaceListCard>
            {entries.map((entry) => (
                <SurfaceListCardItem key={entry.id}>
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                            <Typography type="body-xs" color="muted">
                                {new Date(entry.publishedAt).toLocaleDateString(locale)}
                            </Typography>
                            {entry.category ? (
                                <span
                                    className={cn(
                                        "rounded-full px-2 py-0.5 text-xs font-medium",
                                        CATEGORY_CLASS[entry.category],
                                    )}
                                >
                                    {t(`dashboard.changelogCategory.${entry.category}`)}
                                </span>
                            ) : null}
                        </div>
                        {entry.linkUrl ? (
                            <a
                                href={entry.linkUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm font-medium text-primary hover:underline"
                            >
                                {entry.title}
                            </a>
                        ) : (
                            <Typography type="body-sm" weight="medium">
                                {entry.title}
                            </Typography>
                        )}
                        {entry.body ? (
                            <Typography type="body-sm" color="muted">
                                {entry.body}
                            </Typography>
                        ) : null}
                    </div>
                </SurfaceListCardItem>
            ))}
        </SurfaceListCard>
    )

    // loading → skeleton mirror; loaded → the list (loaded-empty already hidden above)
    const body = (
        <AsyncContent
            isLoading={isLoading && entries.length === 0}
            skeleton={<ChangelogListSkeleton />}
        >
            {list}
        </AsyncContent>
    )

    // dashboard Overview tab: label OUTSIDE + the surface list card as content. The
    // content is itself a card → `frameless` (no LabeledCard frame) avoids card-in-card.
    if (framed) {
        return (
            <LabeledCard frameless label={t("dashboard.changelog")} className={className}>
                {body}
            </LabeledCard>
        )
    }

    // flat: inline heading + list (legacy placement)
    return (
        <div className={cn("flex w-full flex-col gap-3", className)}>
            <span className="text-base font-semibold text-foreground">
                {t("dashboard.changelog")}
            </span>
            {body}
        </div>
    )
}
