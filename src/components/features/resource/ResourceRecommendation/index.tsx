"use client"

import React from "react"
import { Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"
import { useQueryRecommendedSwr } from "../hooks/useQueryRecommendedSwr"

/**
 * Recommended resources (§5/§17). DEFAULT on-canon layout: a "related/recommended"
 * list where each row explains why it's suggested. ponytail: rows hand-rolled;
 * mock data.
 */
export const ResourceRecommendation = () => {
    const t = useTranslations("resourceHub")
    const { recommended } = useQueryRecommendedSwr()

    return (
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 p-6">
            <Typography type="h4" weight="bold">
                {t("recommended.title")}
            </Typography>
            {recommended.map((resource) => (
                <Link
                    key={resource.id}
                    href={`/resources/${resource.id}`}
                    className="flex flex-col gap-1 rounded-3xl border border-separator p-4 no-underline transition-colors hover:bg-default/40"
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
    )
}
