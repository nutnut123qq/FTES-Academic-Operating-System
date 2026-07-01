"use client"

import React, { useMemo } from "react"
import { Link, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import type { HeadhuntingCompanyContactLink } from "../../types"
import { buildHeadhuntingCompanyContactLinks } from "../../utils"
import { useAppSelector } from "@/redux/hooks"

/**
 * Company profile block: logo, title, description, and contact links.
 *
 * Self-contained section (single-use): reads the active company from the Redux
 * singleton itself and derives its contact links, so the container just renders
 * `<HeadhuntingCompanyProfile />`.
 */
export const HeadhuntingCompanyProfile = () => {
    const t = useTranslations()
    const company = useAppSelector((state) => state.headhunter.company)

    const contactLinks = useMemo(
        (): Array<HeadhuntingCompanyContactLink> => buildHeadhuntingCompanyContactLinks(company),
        [company],
    )

    if (!company) {
        return null
    }

    return (
        <div className="flex flex-col gap-3 md:flex-row md:items-start">
            {company.logoUrl ? (
                <img
                    src={company.logoUrl}
                    alt={company.title}
                    className="h-16 w-auto max-w-[200px] object-contain"
                />
            ) : null}
            <div className="flex flex-1 flex-col gap-3">
                <Typography type="h3" weight="bold">{company.title}</Typography>
                {company.description ? (
                    <Typography type="body-sm" color="muted">{company.description}</Typography>
                ) : null}
                {contactLinks.length > 0 ? (
                    <ul className="flex flex-col gap-2">
                        {contactLinks.map((link) => (
                            <li key={link.labelKey} className="flex flex-wrap items-center gap-2">
                                <Typography type="body-sm" weight="medium" color="muted">
                                    {t(link.labelKey)}:
                                </Typography>
                                {link.href ? (
                                    <Link
                                        href={link.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-accent"
                                    >
                                        {link.value}
                                    </Link>
                                ) : (
                                    <Typography type="body-sm">{link.value}</Typography>
                                )}
                            </li>
                        ))}
                    </ul>
                ) : null}
            </div>
        </div>
    )
}
