import useSWRMutation from "swr/mutation"
import { GraphQLHeadersKey, type GraphQLHeaders } from "@/modules/api/graphql/types"
import { mutateGradeInterviewAnswer } from "@/modules/api/graphql/mutations/mutation-grade-interview-answer"
import { type GradeInterviewAnswerRequest } from "@/modules/api/graphql/mutations/types/grade-interview-answer"
import { useAppSelector } from "@/redux/hooks"

type MutateGradeInterviewAnswerResult = Awaited<
    ReturnType<typeof mutateGradeInterviewAnswer>
>

/**
 * SWR mutation for {@link mutateGradeInterviewAnswer}. Mock interview is an
 * enrolled-only feature (it spends AI credits), so the `X-Course-Id` header is
 * sent for the backend `GraphQLMustEnrolledGuard` — alongside the Keycloak session.
 */
export const useMutateGradeInterviewAnswerSwr = () => {
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const courseId = useAppSelector((state) => state.course.entity?.id)
    const swr = useSWRMutation<
        MutateGradeInterviewAnswerResult,
        Error,
        string,
        GradeInterviewAnswerRequest
    >(
        "MUTATE_GRADE_INTERVIEW_ANSWER_SWR",
        async (_key, { arg }) => {
            // grading is enrolled-only — fail fast when signed out / no course context
            if (!authenticated) {
                throw new Error("Not authenticated")
            }
            const headers: GraphQLHeaders | undefined = courseId
                ? { [GraphQLHeadersKey.XCourseId]: courseId }
                : undefined
            return mutateGradeInterviewAnswer({
                request: arg,
                headers,
            })
        },
    )
    return swr
}
