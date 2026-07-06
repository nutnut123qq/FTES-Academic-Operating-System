"use client"

import useSWR from "swr"
import { getCareerSkills, type CareerSkillGraph } from "@/modules/api/rest/career"

/**
 * SWR query wrapper for {@link getCareerSkills}.
 */
export const useGetCareerSkillsSwr = (params?: {
    category?: string
    q?: string
}) => {
    const swr = useSWR<CareerSkillGraph, Error>(
        ["GET_CAREER_SKILLS_SWR", params?.category, params?.q],
        () => getCareerSkills(params),
    )

    return swr
}
