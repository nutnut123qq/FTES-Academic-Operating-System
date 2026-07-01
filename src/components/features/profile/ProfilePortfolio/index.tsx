"use client"

import React from "react"
import { Chip, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { useQueryProfilePortfolioSwr } from "../hooks/useQueryProfilePortfolioSwr"

/**
 * Portfolio section of the profile (§2). DEFAULT on-canon layout: a projects grid
 * + a certificates list. ponytail: cards/rows hand-rolled; mock data.
 */
export const ProfilePortfolio = () => {
    const t = useTranslations("profile")
    const { portfolio } = useQueryProfilePortfolioSwr()

    if (!portfolio) {
        return null
    }

    return (
        <div className="flex flex-col gap-6">
            {/* projects */}
            <div className="flex flex-col gap-3">
                <Typography type="h6" weight="bold">
                    {t("portfolio.projects")}
                </Typography>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {portfolio.projects.map((project) => (
                        <div
                            key={project.id}
                            className="flex flex-col gap-2 rounded-large border border-separator p-4"
                        >
                            <Typography type="body" weight="medium">
                                {project.title}
                            </Typography>
                            <Typography type="body-sm" color="muted">
                                {project.description}
                            </Typography>
                            <Chip size="sm" variant="soft" color="accent" className="self-start">
                                {project.stack}
                            </Chip>
                        </div>
                    ))}
                </div>
            </div>

            {/* certificates */}
            <div className="flex flex-col gap-3 border-t border-separator pt-6">
                <Typography type="h6" weight="bold">
                    {t("portfolio.certificates")}
                </Typography>
                {portfolio.certificates.map((certificate) => (
                    <div
                        key={certificate.id}
                        className="flex items-center gap-3 rounded-large border border-separator p-4"
                    >
                        <Typography type="body-sm" weight="medium" className="min-w-0 flex-1" truncate>
                            {certificate.title}
                        </Typography>
                        <Typography type="body-xs" color="muted">
                            {certificate.issuer}
                        </Typography>
                    </div>
                ))}
            </div>
        </div>
    )
}
