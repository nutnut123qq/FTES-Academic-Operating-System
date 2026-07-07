"use client"

import React from "react"
import { Skeleton, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { useQueryRecommendedSwr } from "../hooks/useQueryRecommendedSwr"

/** Loading skeleton — mirrors a recommendation row (title + reason line). */
const RecommendationSkeleton = () => (
    <div className="flex flex-col gap-3">
        {[0, 1, 2].map((row) => (
            <div key={row} className="flex flex-col gap-2 rounded-2xl border border-separator p-4">
                <Skeleton className="h-4 w-48 rounded-full" />
                <Skeleton className="h-3 w-40 rounded-full" />
            </div>
        ))}
    </div>
)

/**
 * Recommended resources (§5/§17). DEFAULT on-canon layout: a "related/recommended"
 * list where each row explains why it's suggested. ponytail: mock data.
 */
export const ResourceRecommendation = () => {
    const t = useTranslations("resourceHub")
    const { recommended, isLoading, error, mutate } = useQueryRecommendedSwr()

    return (
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 p-6">
            <Typography type="h4" weight="bold">
                {t("recommended.title")}
            </Typography>
            <AsyncContent
                isLoading={isLoading && recommended.length === 0}
                skeleton={<RecommendationSkeleton />}
                isEmpty={recommended.length === 0}
                emptyContent={{ title: t("recommended.empty") }}
                error={recommended.length === 0 ? error : undefined}
                errorContent={{
                    title: t("recommended.loadError"),
                    onRetry: () => void mutate(),
                    retryLabel: t("hub.retry"),
                }}
            >
                <div className="flex flex-col gap-3">
                    {recommended.map((resource) => (
                        <Link
                            key={resource.id}
                            href={`/resources/${resource.id}`}
                            className="flex flex-col gap-0 rounded-2xl border border-separator p-4 no-underline transition-colors hover:bg-default/40"
                        >
                            <Typography type="body-sm" weight="medium" truncate>
                                {resource.title}
                            </Typography>
                            <Typography type="body-xs" color="muted">
                                {resource.reason}
                            </Typography>
                        </Link>
                    ))}
                </div>
            </AsyncContent>
        </div>
    )
}
