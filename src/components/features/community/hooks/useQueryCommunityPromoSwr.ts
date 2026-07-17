"use client"

import { useQueryActiveAdvertisementSwr } from "@/hooks/swr/api/graphql/queries/useQueryActiveAdvertisementSwr"
import {
    AdvertisementMediaType,
    AdvertisementPlacement,
    type AdvertisementCarouselMedia,
    type AdvertisementImageMedia,
    type AdvertisementVideoMedia,
    type QueryActiveAdvertisementData,
} from "@/modules/api/graphql/queries/types/active-advertisement"

/** A promotional card surfaced in the community nav rail. */
export interface CommunityPromo {
    /** Promo image (the ad media resolved to a poster URL). */
    imageUrl: string
    /** Promo title. */
    title: string
    /** CTA link label, or null when the ad has none. */
    ctaText: string | null
    /** Destination when the panel is clicked. */
    linkUrl: string
    /** Sponsor name, or null for house promos. */
    sponsorName: string | null
}

/** Resolve the ad `media` payload to a single poster URL (null when none usable). */
const toImageUrl = (ad: QueryActiveAdvertisementData): string | null => {
    switch (ad.mediaType) {
    case AdvertisementMediaType.Image:
        return (ad.media as AdvertisementImageMedia).url ?? null
    case AdvertisementMediaType.Video:
        return (ad.media as AdvertisementVideoMedia).poster ?? null
    case AdvertisementMediaType.Carousel:
        return (ad.media as AdvertisementCarouselMedia).slides?.[0]?.url ?? null
    default:
        return null
    }
}

/** Map the BE `Advertisement` to the promo panel contract (null when not renderable). */
const toPromo = (ad: QueryActiveAdvertisementData | null | undefined): CommunityPromo | null => {
    if (!ad) {
        return null
    }
    const imageUrl = toImageUrl(ad)
    if (!imageUrl) {
        return null
    }
    return {
        imageUrl,
        title: ad.title,
        ctaText: ad.ctaText,
        linkUrl: ad.linkUrl,
        sponsorName: ad.sponsorName,
    }
}

/**
 * Loads the active community rail promo from the real BE — GraphQL
 * `activeAdvertisement(placement: COMMUNITY_RAIL)` via
 * {@link useQueryActiveAdvertisementSwr}. `promo` is `null` when no ad is active
 * (the panel hides itself).
 */
export const useQueryCommunityPromoSwr = () => {
    const { data, isLoading, error } = useQueryActiveAdvertisementSwr({
        placement: AdvertisementPlacement.CommunityRail,
    })
    return { promo: toPromo(data), isLoading, error }
}
