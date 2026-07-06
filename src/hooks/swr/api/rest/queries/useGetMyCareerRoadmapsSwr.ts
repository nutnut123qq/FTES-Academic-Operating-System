"use client"

import useSWR from "swr"
import { getMyCareerRoadmaps, type CareerMyRoadmap } from "@/modules/api/rest/career"

/**
 * SWR query wrapper for {@link getMyCareerRoadmaps}.
 */
export const useGetMyCareerRoadmapsSwr = () => {
    const swr = useSWR<CareerMyRoadmap[], Error>(
        ["GET_MY_CAREER_ROADMAPS_SWR"],
        () => getMyCareerRoadmaps(),
    )

    return swr
}
