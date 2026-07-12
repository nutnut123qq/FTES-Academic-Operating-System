"use client"

import useSWR from "swr"
import type { SWRConfiguration } from "swr"
import { getInterviewTemplate, type InterviewTemplateFullView } from "@/modules/api/rest/interview"

/**
 * SWR query wrapper for {@link getInterviewTemplate}.
 */
export const useGetInterviewTemplateSwr = (
    courseRef: string,
    options?: SWRConfiguration<InterviewTemplateFullView, Error>,
) => {
    const swr = useSWR<InterviewTemplateFullView, Error>(
        courseRef ? ["GET_INTERVIEW_TEMPLATE_SWR", courseRef] : null,
        () => getInterviewTemplate(courseRef),
        options,
    )

    return swr
}
