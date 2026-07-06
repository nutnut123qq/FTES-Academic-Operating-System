"use client"

import useSWR from "swr"
import {
    getPersonalizeExportDownload,
    type RecommendationExportDownloadView,
} from "@/modules/api/rest/recommendation"

/**
 * SWR query wrapper for {@link getPersonalizeExportDownload}.
 */
export const useGetPersonalizeExportDownloadSwr = (id: string) => {
    const swr = useSWR<RecommendationExportDownloadView, Error>(
        ["GET_PERSONALIZE_EXPORT_DOWNLOAD_SWR", id],
        () => getPersonalizeExportDownload(id),
    )

    return swr
}
