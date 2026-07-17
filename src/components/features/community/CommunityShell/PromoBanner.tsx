"use client"

import React, { useState } from "react"
import { Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"
import { useQueryCommunityPromoSwr } from "../hooks/useQueryCommunityPromoSwr"

/** Promo banner panel under the left community nav rail on `xl`+. */
export const PromoBanner = () => {
    const t = useTranslations("communityHub")
    const { promo } = useQueryCommunityPromoSwr()
    // Hide the whole panel if the ad's image URL is dead (404/broken) — the image is the
    // panel's only media, so a broken <img> inside the card link is worse than no ad.
    const [imageFailed, setImageFailed] = useState(false)

    if (!promo || imageFailed) {
        return null
    }

    const isExternal = /^https?:\/\//i.test(promo.linkUrl)
    const content = (
        <>
            <img
                src={promo.imageUrl}
                alt={promo.title}
                onError={() => setImageFailed(true)}
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
                {promo.ctaText ? (
                    <Typography type="body-xs" className="text-accent">
                        {promo.ctaText}
                    </Typography>
                ) : null}
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
