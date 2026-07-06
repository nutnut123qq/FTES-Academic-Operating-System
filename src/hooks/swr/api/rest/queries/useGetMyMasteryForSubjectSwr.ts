"use client"

import useSWR from "swr"
import {
    getMyMasteryForSubject,
    type MasteryView,
} from "@/modules/api/rest/gamification"

/**
 * SWR query wrapper for {@link getMyMasteryForSubject}.
 */
export const useGetMyMasteryForSubjectSwr = (subjectId: string) => {
    const swr = useSWR<MasteryView, Error>(
        ["GET_MY_MASTERY_FOR_SUBJECT_SWR", subjectId],
        () => getMyMasteryForSubject(subjectId),
    )

    return swr
}
