"use client"

import useSWR from "swr"

/** A promotional card surfaced in the community nav rail. */
export interface CommunityPromo {
    /** Promo image — fixed seed so it is deterministic in mock mode. */
    imageUrl: string
    /** Promo title. */
    title: string
    /** CTA link label. */
    ctaText: string
    /** Destination when the panel is clicked. */
    linkUrl: string
    /** Sponsor name, or null for house promos. */
    sponsorName: string | null
}

// ponytail: mock BE — no community promo endpoint yet. Deterministic sample.
// Swap point: replace with useQueryActiveAdvertisementSwr({ placement: "community-rail" })
// from src/hooks/swr/api/graphql/queries/useQueryActiveAdvertisementSwr.ts once the
// placement contract is ready.
const fetchCommunityPromoMock = async (): Promise<CommunityPromo> => ({
    imageUrl: "https://picsum.photos/seed/ftes-promo/640/360",
    title: "Khám phá khoá học mới trên FTES",
    ctaText: "Tìm hiểu ngay",
    linkUrl: "/marketplace",
    sponsorName: null,
})

/** Loads the active community rail promo. Mocked; SWR-shaped for a drop-in BE swap. */
export const useQueryCommunityPromoSwr = () => {
    const { data, isLoading, error } = useSWR(["community-promo"], () => fetchCommunityPromoMock())
    return { promo: data ?? null, isLoading, error }
}
