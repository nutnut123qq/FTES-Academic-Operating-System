"use client"

import useSWR from "swr"
import {
    getResourceDownloadUrl,
    type DownloadUrlResponse,
} from "@/modules/api/rest/resource"

/**
 * SWR query wrapper for {@link getResourceDownloadUrl}.
 */
export const useGetResourceDownloadUrlSwr = (id: string) => {
    const swr = useSWR<DownloadUrlResponse, Error>(
        ["GET_RESOURCE_DOWNLOAD_URL_SWR", id],
        () => getResourceDownloadUrl(id),
    )

    return swr
}
