"use client"

import React from "react"
import { cn } from "@heroui/react"
import { useTranslations } from "next-intl"
import { ContinueCard } from "@/components/blocks/cards/ContinueCard"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { useQueryContinueLearningSwr } from "../../hooks/useQueryContinueLearningSwr"

/** Props for {@link ContinueLearning}. */
export type ContinueLearningProps = WithClassNames<undefined>

/**
 * "Continue learning" content — the next-action slot: resume cards (course +
 * progress bar + resume CTA), each a house {@link ContinueCard}. Content only
 * (the parent frames it). Self-fetches its own mock leaf query.
 * @param props - optional root class name (placement only)
 */
export const ContinueLearning = ({ className }: ContinueLearningProps) => {
    const t = useTranslations("analytics")
    const { items, isLoading, error, mutate } = useQueryContinueLearningSwr()

    return (
        <AsyncContent
            isLoading={isLoading}
            error={error}
            errorContent={{
                title: t("overview.loadError"),
                onRetry: () => { void mutate() },
                retryLabel: t("overview.retry"),
            }}
            isEmpty={items.length === 0}
            emptyContent={{ title: t("overview.continue.empty") }}
            skeleton={(
                <div className={cn("grid gap-3 sm:grid-cols-2", className)}>
                    {[0, 1].map((i) => (
                        <Skeleton key={i} className="h-24 w-full rounded-large" />
                    ))}
                </div>
            )}
        >
            <div className={cn("grid gap-3 sm:grid-cols-2", className)}>
                {items.map((item) => (
                    <ContinueCard
                        key={item.id}
                        title={item.title}
                        subtitle={item.subtitle}
                        value={item.current}
                        max={item.total}
                        ctaLabel={t("overview.continue.resume")}
                        href={item.href}
                    />
                ))}
            </div>
        </AsyncContent>
    )
}
