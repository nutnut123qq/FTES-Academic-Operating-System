"use client"

import React from "react"
import { Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"
import { useQueryCommunityPromoSwr } from "../hooks/useQueryCommunityPromoSwr"

/** Promo banner panel under the left community nav rail on `xl`+. */
export const PromoBanner = () => {
    const t = useTranslations("communityHub")
    const { promo } = useQueryCommunityPromoSwr()

    if (!promo) {
        return null
    }

    const isExternal = /^https?:\/\//i.test(promo.linkUrl)
    const content = (
        <>
            <img
                src={promo.imageUrl}
                alt={promo.title}
                className="aspect-video w-full object-cover"
            />
            <div className="flex flex-col gap-1 p-3">
                {promo.sponsorName ? (
                    <Typography type="body-xs" color="muted">
                        {t("promo.sponsored")} · {promo.sponsorName}
                    </Typography>
                ) : null}
                <Typography type="body-sm" weight="semibold" className="line-clamp-2">
                    {promo.title}
                </Typography>
                <Typography type="body-xs" className="text-accent">
                    {promo.ctaText}
                </Typography>
            </div>
        </>
    )

    const className =
        "flex flex-col overflow-hidden rounded-3xl border border-separator bg-surface no-underline transition-colors hover:bg-default/40"

    return isExternal ? (
        <a
            href={promo.linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={className}
        >
            {content}
        </a>
    ) : (
        <Link href={promo.linkUrl} className={className}>
            {content}
        </Link>
    )
}
