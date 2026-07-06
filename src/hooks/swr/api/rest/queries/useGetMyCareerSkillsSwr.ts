"use client"

import useSWR from "swr"
import {
    getMyCareerSkills,
    type CareerSkillProgress,
} from "@/modules/api/rest/career"

/**
 * SWR query wrapper for {@link getMyCareerSkills}.
 */
export const useGetMyCareerSkillsSwr = () => {
    const swr = useSWR<CareerSkillProgress[], Error>(
        ["GET_MY_CAREER_SKILLS_SWR"],
        () => getMyCareerSkills(),
    )

    return swr
}
