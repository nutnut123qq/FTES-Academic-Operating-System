import useSWRMutation from "swr/mutation"
import {
    requestCareerMentor,
    type CareerMentorship,
    type RequestCareerMentorRequest,
} from "@/modules/api/rest/career"

/**
 * Params for {@link usePostRequestCareerMentorSwr}.
 */
export interface RequestCareerMentorParams {
    mentorId: string
    request: RequestCareerMentorRequest
}

/**
 * SWR mutation wrapper for {@link requestCareerMentor}.
 */
export const usePostRequestCareerMentorSwr = () => {
    const swr = useSWRMutation<
        CareerMentorship,
        Error,
        string,
        RequestCareerMentorParams
    >("POST_REQUEST_CAREER_MENTOR_SWR", async (_key, { arg }) => {
        return requestCareerMentor(arg.mentorId, arg.request)
    })

    return swr
}
