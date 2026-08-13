"use client"

import React from "react"
import { cn } from "@heroui/react"
import { useTranslations } from "next-intl"
import { useRouter } from "@/i18n/navigation"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { LabeledCard } from "@/components/blocks/cards/LabeledCard"
import { SurfaceListCard, SurfaceListCardRow } from "@/components/blocks/cards/SurfaceListCard"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { useQueryStoreProductsSwr } from "@/components/features/marketplace/hooks/useQueryStoreProductsSwr"
import type { WithClassNames } from "@/modules/types/base/class-name"

/**
 * How many products the dashboard teaser shows before deferring to `/marketplace`.
 *
 * Kept small on purpose: the shop currently stocks a handful of items (courses are
 * sold from their own detail page, not here), so a longer list would simply render
 * the entire catalogue and make the "Xem tất cả" link a lie.
 */
const EXPLORE_MARKETPLACE_LIMIT = 4

/** Loading state — mirrors the surface list (two text lines per row + price column). */
const ExploreMarketplaceSkeleton = () => (
    <SurfaceListCard>
        {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="flex items-center gap-3 px-4 py-4">
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <Skeleton.Typography type="body-sm" width="3/4" />
                    <Skeleton.Typography type="body-xs" width="1/3" />
                </div>
                <Skeleton.Typography type="body-xs" width="1/4" />
            </div>
        ))}
    </SurfaceListCard>
)

/** Props for {@link ExploreMarketplace}. */
export type ExploreMarketplaceProps = WithClassNames<undefined>

/**
 * "Cửa hàng" teaser of the dashboard EXPLORE tab — a few things the learner can
 * spend FTES Coin on, as whole-row links into `/marketplace`.
 *
 * The order is the store's own (`createdAt` DESC per product type): the commerce
 * backend exposes no "featured" or "recommended" endpoint, so this card must NOT be
 * labelled as a personalised or curated pick — it is the newest few items and
 * nothing more.
 *
 * Reuses the store's own hook rather than mounting `MarketplaceCatalog`: that one is
 * a PAGE component (it brings its own `max-w-6xl` container, heading, search and
 * category filter) and would fight the dashboard column it sits in.
 *
 * Self-fetches its own leaf query and owns its four states; the section label and
 * the "see all" link sit OUTSIDE the async switch so the card keeps its identity
 * while loading, empty or failed.
 *
 * @param props - optional root class name (placement only)
 */
export const ExploreMarketplace = ({ className }: ExploreMarketplaceProps) => {
    const t = useTranslations()
    const router = useRouter()
    const { products, isLoading, error, mutate } = useQueryStoreProductsSwr()

    return (
        <LabeledCard
            frameless
            className={cn(className)}
            label={t("dashboard.explore.marketplace.title")}
            onSeeMore={() => router.push("/marketplace")}
            seeMoreLabel={t("dashboard.explore.viewAll")}
        >
            <AsyncContent
                isLoading={isLoading && products.length === 0}
                skeleton={<ExploreMarketplaceSkeleton />}
                isEmpty={products.length === 0}
                emptyContent={{
                    title: t("dashboard.explore.marketplace.empty.title"),
                    description: t("dashboard.explore.marketplace.empty.description"),
                }}
                error={products.length === 0 ? error : undefined}
                errorContent={{
                    title: t("dashboard.explore.marketplace.error.title"),
                    onRetry: () => { void mutate() },
                    retryLabel: t("dashboard.retry"),
                }}
            >
                <SurfaceListCard>
                    {products.slice(0, EXPLORE_MARKETPLACE_LIMIT).map((product) => (
                        <SurfaceListCardRow
                            key={product.id}
                            title={product.name}
                            subtitle={t(`marketplace.categories.${product.category}`)}
                            meta={(
                                <span className="shrink-0 text-xs text-muted tabular-nums">
                                    {product.priceCoin !== null
                                        ? t("marketplace.priceCoin", { amount: product.priceCoin })
                                        : product.priceVnd !== null
                                            ? t("marketplace.priceVnd", { amount: product.priceVnd })
                                            : t("marketplace.priceUnavailable")}
                                </span>
                            )}
                            hover="underline"
                            onPress={() => router.push("/marketplace")}
                        />
                    ))}
                </SurfaceListCard>
            </AsyncContent>
        </LabeledCard>
    )
}
