"use client"

import useSWR from "swr"
import { getCareerRoadmaps, type CareerRoadmap } from "@/modules/api/rest/career"

/**
 * SWR query wrapper for {@link getCareerRoadmaps}.
 */
export const useGetCareerRoadmapsSwr = (params?: { track?: string }) => {
    const swr = useSWR<CareerRoadmap[], Error>(
        ["GET_CAREER_ROADMAPS_SWR", params?.track],
        () => getCareerRoadmaps(params),
    )

    return swr
}
