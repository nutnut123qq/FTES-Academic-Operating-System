"use client"

import useSWR from "swr"
import {
    getCareerRoadmapDetail,
    type CareerRoadmapDetail,
} from "@/modules/api/rest/career"

/**
 * SWR query wrapper for {@link getCareerRoadmapDetail}.
 */
export const useGetCareerRoadmapDetailSwr = (slug: string) => {
    const swr = useSWR<CareerRoadmapDetail, Error>(
        ["GET_CAREER_ROADMAP_DETAIL_SWR", slug],
        () => getCareerRoadmapDetail(slug),
    )

    return swr
}
