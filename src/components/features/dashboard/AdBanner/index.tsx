"use client"

import React, {
    useEffect,
    useState,
} from "react"
import {
    useTranslations,
} from "next-intl"
import {
    Button,
    Card,
    CardContent,
    cn,
} from "@heroui/react"
import type {
    WithClassNames,
} from "@/modules/types/base/class-name"
import type { QueryActiveAdvertisementData, AdvertisementImageMedia, AdvertisementVideoMedia, AdvertisementCarouselMedia } from "@/modules/api/graphql/queries/types/active-advertisement"
import { AdvertisementMediaType } from "@/modules/api/graphql/queries/types/active-advertisement"

/** Props for {@link AdBanner}. */
export interface AdBannerProps extends WithClassNames<undefined> {
    /** The active advertisement to render. */
    ad: QueryActiveAdvertisementData
}

/** Default carousel auto-advance interval (ms) when the ad omits one. */
const DEFAULT_CAROUSEL_INTERVAL = 4000

/**
 * Renders a single advertisement banner, branching on `mediaType`
 * (image / video / carousel). The whole banner links to `ad.linkUrl` in a new
 * tab; a "Sponsored" tag shows for paid slots. `"use client"` for the carousel
 * timer + video element.
 * @param props - the active ad
 */
export const AdBanner = ({
    ad,
    className,
}: AdBannerProps) => {
    const t = useTranslations()

    // carousel slide index (only used when mediaType === carousel)
    const [slide, setSlide] = useState(0)
    const carousel = ad.mediaType === AdvertisementMediaType.Carousel
        ? (ad.media as AdvertisementCarouselMedia)
        : null

    // auto-advance the carousel; cleared on unmount / when the ad changes
    useEffect(
        () => {
            if (!carousel || carousel.slides.length <= 1) {
                return
            }
            const interval = setInterval(
                () => setSlide((current) => (current + 1) % carousel.slides.length),
                carousel.intervalMs ?? DEFAULT_CAROUSEL_INTERVAL,
            )
            return () => clearInterval(interval)
        },
        [
            carousel,
        ],
    )

    /** The media area — one branch per media kind. */
    const renderMedia = () => {
        switch (ad.mediaType) {
        case AdvertisementMediaType.Image: {
            const media = ad.media as AdvertisementImageMedia
            return (
                <img
                    src={media.url}
                    alt={ad.title}
                    className="aspect-video w-full rounded-medium object-cover"
                />
            )
        }
        case AdvertisementMediaType.Video: {
            const media = ad.media as AdvertisementVideoMedia
            return (
                <video
                    src={media.url}
                    poster={media.poster}
                    autoPlay={media.autoplay}
                    loop={media.loop}
                    // autoplay only works muted; default muted on unless told otherwise
                    muted={media.muted ?? media.autoplay ?? true}
                    playsInline
                    controls={!media.autoplay}
                    className="aspect-video w-full rounded-medium object-cover"
                />
            )
        }
        case AdvertisementMediaType.Carousel: {
            const media = ad.media as AdvertisementCarouselMedia
            const current = media.slides[slide] ?? media.slides[0]
            return (
                <div className="relative">
                    <img
                        src={current?.url}
                        alt={ad.title}
                        className="aspect-video w-full rounded-medium object-cover"
                    />
                    {/* slide dots */}
                    {media.slides.length > 1 ? (
                        <div className="absolute inset-x-0 bottom-2 flex justify-center gap-1.5">
                            {media.slides.map((item, index) => (
                                <span
                                    key={item.url}
                                    className={`size-1.5 rounded-full ${
                                        index === slide ? "bg-white" : "bg-white/50"
                                    }`}
                                />
                            ))}
                        </div>
                    ) : null}
                </div>
            )
        }
        default:
            return null
        }
    }

    return (
        <Card className={cn(className)}>
            <CardContent className="flex flex-col gap-3">
                {/* "Sponsored" / "Ad" tag row */}
                <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-wide text-muted">
                        {ad.sponsorName
                            ? t("dashboard.sponsoredBy", {
                                sponsor: ad.sponsorName,
                            })
                            : t("dashboard.sponsored")}
                    </span>
                </div>

                {/* clickable media → external link */}
                <a
                    href={ad.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                >
                    {renderMedia()}
                </a>

                <div className="text-sm font-semibold text-foreground">
                    {ad.title}
                </div>

                {ad.ctaText ? (
                    <Button
                        variant="secondary"
                        fullWidth
                        onPress={() => window.open(ad.linkUrl,
                            "_blank",
                            "noopener,noreferrer")}
                    >
                        {ad.ctaText}
                    </Button>
                ) : null}
            </CardContent>
        </Card>
    )
}
