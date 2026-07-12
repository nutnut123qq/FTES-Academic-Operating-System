"use client"

import useSWRMutation from "swr/mutation"
import {
    generateInterviewTemplate,
    type GenerateInterviewTemplateRequest,
    type GenerateInterviewTemplateView,
} from "@/modules/api/rest/interview"

/**
 * SWR mutation wrapper for {@link generateInterviewTemplate}.
 */
export const usePostGenerateInterviewTemplateSwr = () => {
    const swr = useSWRMutation<GenerateInterviewTemplateView, Error, string, GenerateInterviewTemplateRequest>(
        "POST_GENERATE_INTERVIEW_TEMPLATE_SWR",
        async (_key, { arg }) => {
            return generateInterviewTemplate(arg)
        },
    )

    return swr
}
