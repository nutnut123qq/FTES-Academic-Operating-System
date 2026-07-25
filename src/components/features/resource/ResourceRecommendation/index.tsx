"use client"

import React from "react"
import { Skeleton, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { resolveResourceErrorKey } from "../hooks/useQueryCollectionsSwr"
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
 * Recommended resources (§5/§17), backed by the real recommendation engine
 * (`GET /api/v1/recommendations?type=RESOURCE`). Each row links to the real
 * `/resources/{id}` detail and explains itself with the localized reason derived
 * from the structured `Reason{code, params}` (unknown codes degrade to the generic
 * caption). Auth-gated: guests get a sign-in CTA instead of a 401.
 */
export const ResourceRecommendation = () => {
    const t = useTranslations("resourceHub")
    const { recommended, isLoading, error, authenticated, mutate } = useQueryRecommendedSwr()
    const { requireAuth } = useRequireAuth()

    return (
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 p-6">
            <Typography type="h4" weight="bold">
                {t("recommended.title")}
            </Typography>
            <AsyncContent
                isLoading={isLoading && recommended.length === 0}
                skeleton={<RecommendationSkeleton />}
                isEmpty={recommended.length === 0}
                emptyContent={
                    authenticated
                        ? { title: t("recommended.empty") }
                        : {
                              title: t("recommended.signInTitle"),
                              onRetry: () => void requireAuth("auth.context.generic"),
                              retryLabel: t("recommended.signIn"),
                          }
                }
                error={recommended.length === 0 ? error : undefined}
                errorContent={{
                    title: t("recommended.loadError"),
                    description: error ? t(`apiErrors.${resolveResourceErrorKey(error)}`) : undefined,
                    onRetry: () => void mutate(),
                    retryLabel: t("hub.retry"),
                }}
            >
                <div className="flex flex-col gap-3">
                    {recommended.map((resource) => (
                        <Link
                            key={resource.id}
                            href={`/resources/${resource.resourceId}`}
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
