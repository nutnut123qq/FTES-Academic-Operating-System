"use client"

import React, { useState } from "react"
import { Button, Chip, Typography } from "@heroui/react"
import { useFormatter, useTranslations } from "next-intl"
import {
    CoinsIcon,
    LockKeyOpenIcon,
    SparkleIcon,
    StorefrontIcon,
    TShirtIcon,
    TicketIcon,
} from "@phosphor-icons/react"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { useQueryProductsSwr, type Product, type ProductCategory } from "../hooks/useQueryProductsSwr"

/** Category filter options: "all" + every product category. */
const CATEGORIES: Array<ProductCategory | "all"> = ["all", "merch", "premium", "aiCredits", "voucher", "courseUnlock"]

/** Per-category badge icon. Phosphor; tokens own the color. */
const CATEGORY_ICON: Record<ProductCategory, React.ComponentType<{ className?: string }>> = {
    merch: TShirtIcon,
    premium: SparkleIcon,
    aiCredits: CoinsIcon,
    voucher: TicketIcon,
    courseUnlock: LockKeyOpenIcon,
}

/**
 * Marketplace catalog (§13) — the `/marketplace` product list. Mirrors the house
 * catalog archetype (see `SubjectCatalog`): text search + category filter + a grid
 * of product cards priced in FTES Coin with a mock "Mua" action. Feature owns data
 * (mock) + filtering; tokens own the look. ponytail: plain search input + hand-rolled
 * cards, mock data, no cart/checkout.
 */
export const MarketplaceCatalog = () => {
    const t = useTranslations("marketplace")
    const { products, isLoading, error, mutate } = useQueryProductsSwr()
    const [query, setQuery] = useState("")
    const [category, setCategory] = useState<ProductCategory | "all">("all")

    const filtered = products.filter((product) => {
        const matchesCategory = category === "all" || product.category === category
        const matchesQuery =
            query.trim() === "" ||
            `${product.name} ${product.description}`.toLowerCase().includes(query.trim().toLowerCase())
        return matchesCategory && matchesQuery
    })

    return (
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
            <div className="flex flex-col gap-0">
                <div className="flex items-center gap-2">
                    <StorefrontIcon className="size-6 text-accent" aria-hidden />
                    <Typography type="h4" weight="bold">
                        {t("catalog.title")}
                    </Typography>
                </div>
                <Typography type="body-sm" color="muted">
                    {t("catalog.subtitle")}
                </Typography>
            </div>

            {/* search + category filter — static chrome, stays outside the skeleton */}
            <div className="flex flex-col gap-3">
                <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder={t("catalog.searchPlaceholder")}
                    aria-label={t("catalog.searchPlaceholder")}
                    className="w-full rounded-large border border-separator bg-transparent px-4 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus:border-accent"
                />
                <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map((option) => (
                        <Button
                            key={option}
                            size="sm"
                            variant={category === option ? "secondary" : "ghost"}
                            onPress={() => setCategory(option)}
                        >
                            {option === "all" ? t("catalog.all") : t(`categories.${option}`)}
                        </Button>
                    ))}
                </div>
            </div>

            {/* product grid — skeleton while loading, error/empty via house states */}
            <AsyncContent
                isLoading={isLoading}
                skeleton={
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {Array.from({ length: 6 }, (_, index) => (
                            <ProductCardSkeleton key={index} />
                        ))}
                    </div>
                }
                error={error}
                errorContent={{
                    title: t("catalog.errorTitle"),
                    description: t("catalog.errorDescription"),
                    onRetry: () => void mutate(),
                    retryLabel: t("catalog.retry"),
                }}
                isEmpty={filtered.length === 0}
                emptyContent={{
                    title: t("catalog.empty"),
                    icon: <StorefrontIcon aria-hidden focusable="false" className="size-8 text-muted" />,
                }}
            >
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {filtered.map((product) => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            </AsyncContent>
        </div>
    )
}

/** One product card: icon badge, name, category chip, coin price + mock buy. */
const ProductCard = ({ product }: { product: Product }) => {
    const t = useTranslations("marketplace")
    const format = useFormatter()
    const Icon = CATEGORY_ICON[product.category]

    return (
        <div className="flex flex-col gap-3 rounded-2xl border border-separator p-4">
            <div className="flex items-center gap-3">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-large bg-accent/10 text-accent">
                    <Icon className="size-6" aria-hidden />
                </div>
                <div className="min-w-0">
                    <Typography type="body-sm" weight="medium" truncate>
                        {product.name}
                    </Typography>
                    <Chip size="sm" variant="soft" color="accent" className="mt-2">
                        {t(`categories.${product.category}`)}
                    </Chip>
                </div>
            </div>

            <Typography type="body-xs" color="muted" className="line-clamp-2">
                {product.description}
            </Typography>

            <div className="mt-auto flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-accent">
                    <CoinsIcon className="size-4" aria-hidden />
                    <Typography type="body-sm" weight="bold" className="text-accent">
                        {t("priceCoin", { amount: format.number(product.priceCoin) })}
                    </Typography>
                </div>
                <Button size="sm" variant="secondary">
                    {t("buy")}
                </Button>
            </div>
        </div>
    )
}

/**
 * Skeleton mirroring {@link ProductCard}: identity row (badge + name line + chip),
 * two description lines, and the price/action footer row — same boxes, same
 * proportions, same `rounded-2xl` frame.
 */
const ProductCardSkeleton = () => (
    <div className="flex flex-col gap-3 rounded-2xl border border-separator p-4">
        <div className="flex items-center gap-3">
            <Skeleton className="size-11 shrink-0 rounded-large" />
            <div className="flex min-w-0 flex-1 flex-col gap-2">
                <Skeleton.Typography type="body-sm" width="1/2" />
                <Skeleton.Chip />
            </div>
        </div>
        <div className="flex flex-col">
            <Skeleton.Typography type="body-xs" width="full" />
            <Skeleton.Typography type="body-xs" width="2/3" />
        </div>
        <div className="mt-auto flex items-center justify-between gap-2">
            <Skeleton.Typography type="body-sm" width="1/4" />
            <Skeleton.Button width="w-16" />
        </div>
    </div>
)
