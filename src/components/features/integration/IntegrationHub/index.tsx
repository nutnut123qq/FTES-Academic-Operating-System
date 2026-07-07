"use client"

import React from "react"
import { Button, Chip, Skeleton, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import {
    ChatCircleDotsIcon,
    CloudIcon,
    CodeIcon,
    CreditCardIcon,
    PlugIcon,
    ShieldCheckIcon,
    SparkleIcon,
} from "@phosphor-icons/react"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { useQueryIntegrationsSwr, type Integration } from "../hooks/useQueryIntegrationsSwr"

/** Ordered category groups so the grid renders in a stable, sensible sequence. */
const CATEGORY_ORDER: Array<Integration["category"]> = [
    "auth",
    "developer",
    "communication",
    "payment",
    "ai",
    "storage",
]

/** Category → Phosphor icon. One badge glyph per category. */
const CATEGORY_ICON: Record<Integration["category"], React.ComponentType<{ className?: string }>> = {
    auth: ShieldCheckIcon,
    developer: CodeIcon,
    communication: ChatCircleDotsIcon,
    payment: CreditCardIcon,
    ai: SparkleIcon,
    storage: CloudIcon,
}

/** Loading skeleton — mirrors a category group: a label + a card grid, cards echoing
 *  the real icon tile + name/chip + status row layout so the box never jumps on resolve. */
const IntegrationsSkeleton = () => (
    <div className="flex flex-col gap-6">
        {[0, 1].map((group) => (
            <div key={group} className="flex flex-col gap-3">
                <Skeleton className="h-4 w-24 rounded-full" />
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {[0, 1, 2].map((card) => (
                        <div
                            key={card}
                            className="flex flex-col gap-3 rounded-2xl border border-separator p-4"
                        >
                            <div className="flex items-center gap-3">
                                <Skeleton className="size-11 shrink-0 rounded-large" />
                                <div className="flex min-w-0 flex-1 flex-col gap-2">
                                    <Skeleton className="h-4 w-24 rounded-full" />
                                    <Skeleton className="h-5 w-16 rounded-full" />
                                </div>
                            </div>
                            <div className="flex items-center justify-between gap-2">
                                <Skeleton className="h-3 w-20 rounded-full" />
                                <Skeleton className="h-8 w-20 rounded-large" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        ))}
    </div>
)

/**
 * Integration Hub (§23) — the `/integrations` page. Connected/available third-party
 * services grouped by category. Feature owns data (mock) + grouping; tokens own the
 * look. Connect/disconnect are mock no-ops (FE-only shell). ponytail: hand-rolled
 * cards + mock data, no real OAuth wiring.
 */
export const IntegrationHub = () => {
    const t = useTranslations("integration")
    const { integrations, isLoading, error, mutate } = useQueryIntegrationsSwr()

    // Group by category, preserving CATEGORY_ORDER; skip empty groups.
    const groups = CATEGORY_ORDER.map((category) => ({
        category,
        items: integrations.filter((integration) => integration.category === category),
    })).filter((group) => group.items.length > 0)

    return (
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
            <div className="flex flex-col gap-0">
                <div className="flex items-center gap-2">
                    <PlugIcon className="size-6 text-accent" aria-hidden="true" />
                    <Typography type="h4" weight="bold">
                        {t("title")}
                    </Typography>
                </div>
                <Typography type="body-sm" color="muted">
                    {t("subtitle")}
                </Typography>
            </div>

            <AsyncContent
                isLoading={isLoading && integrations.length === 0}
                skeleton={<IntegrationsSkeleton />}
                isEmpty={integrations.length === 0}
                emptyContent={{
                    icon: <PlugIcon aria-hidden focusable="false" className="size-8 text-muted" />,
                    title: t("empty.title"),
                    description: t("empty.description"),
                }}
                error={integrations.length === 0 ? error : undefined}
                errorContent={{
                    title: t("loadError.title"),
                    description: t("loadError.description"),
                    onRetry: () => void mutate(),
                    retryLabel: t("loadError.retry"),
                }}
            >
                <div className="flex flex-col gap-6">
                    {groups.map((group) => {
                        const CategoryIcon = CATEGORY_ICON[group.category]
                        return (
                            <section key={group.category} className="flex flex-col gap-3">
                                <Typography type="body-sm" weight="medium" color="muted">
                                    {t(`categories.${group.category}`)}
                                </Typography>
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                    {group.items.map((integration) => (
                                        <div
                                            key={integration.id}
                                            className="flex flex-col gap-3 rounded-2xl border border-separator p-4"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="flex size-11 shrink-0 items-center justify-center rounded-large bg-accent/10 text-accent">
                                                    <CategoryIcon className="size-5" aria-hidden="true" />
                                                </div>
                                                <div className="min-w-0">
                                                    <Typography type="body-sm" weight="medium" truncate>
                                                        {t(`services.${integration.key}`)}
                                                    </Typography>
                                                    <Chip size="sm" variant="soft" color="accent">
                                                        {t(`categories.${integration.category}`)}
                                                    </Chip>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between gap-2">
                                                <Typography
                                                    type="body-xs"
                                                    weight="medium"
                                                    className={
                                                        integration.connected
                                                            ? "text-success"
                                                            : "text-muted"
                                                    }
                                                >
                                                    {integration.connected
                                                        ? t("connected")
                                                        : t("notConnected")}
                                                </Typography>
                                                <Button
                                                    size="sm"
                                                    variant={integration.connected ? "ghost" : "secondary"}
                                                >
                                                    {integration.connected
                                                        ? t("disconnect")
                                                        : t("connect")}
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )
                    })}
                </div>
            </AsyncContent>
        </div>
    )
}
