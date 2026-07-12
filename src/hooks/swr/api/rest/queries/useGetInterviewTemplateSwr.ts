"use client"

import useSWR from "swr"
import { getInterviewTemplate, type InterviewTemplateView } from "@/modules/api/rest/interview"

/**
 * SWR query wrapper for {@link getInterviewTemplate}.
 */
export const useGetInterviewTemplateSwr = (courseRef: string) => {
    const swr = useSWR<InterviewTemplateView, Error>(
        courseRef ? ["GET_INTERVIEW_TEMPLATE_SWR", courseRef] : null,
        () => getInterviewTemplate(courseRef),
    )

    return swr
}
