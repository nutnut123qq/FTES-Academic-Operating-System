"use client"

import React from "react"
import { Button, Chip, Typography } from "@heroui/react"
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

/**
 * Integration Hub (§23) — the `/integrations` page. Connected/available third-party
 * services grouped by category. Feature owns data (mock) + grouping; tokens own the
 * look. Connect/disconnect are mock no-ops (FE-only shell). ponytail: hand-rolled
 * cards + mock data, no real OAuth wiring.
 */
export const IntegrationHub = () => {
    const t = useTranslations("integration")
    const { integrations } = useQueryIntegrationsSwr()

    // Group by category, preserving CATEGORY_ORDER; skip empty groups.
    const groups = CATEGORY_ORDER.map((category) => ({
        category,
        items: integrations.filter((integration) => integration.category === category),
    })).filter((group) => group.items.length > 0)

    return (
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
            <div className="flex flex-col gap-1">
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
    )
}
