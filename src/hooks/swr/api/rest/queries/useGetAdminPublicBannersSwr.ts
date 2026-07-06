"use client"

import useSWR from "swr"
import {
    getAdminPublicBanners,
    type AdminBannerView,
} from "@/modules/api/rest/admin"

/**
 * SWR query wrapper for {@link getAdminPublicBanners}.
 */
export const useGetAdminPublicBannersSwr = (placement: string) => {
    const swr = useSWR<AdminBannerView[], Error>(
        ["GET_ADMIN_PUBLIC_BANNERS_SWR", placement],
        () => getAdminPublicBanners(placement),
    )

    return swr
}
