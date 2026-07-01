import useSWRMutation from "swr/mutation"
import { GraphQLHeadersKey } from "@/modules/api/graphql/types"
import { mutateSubmitPersonalProjectIdeal } from "@/modules/api/graphql/mutations/mutation-submit-personal-project-ideal"
import { type SubmitPersonalProjectIdealRequest } from "@/modules/api/graphql/mutations/types/submit-personal-project-ideal"
import { useAppSelector } from "@/redux/hooks"

type MutateSubmitPersonalProjectIdealResult = Awaited<
    ReturnType<typeof mutateSubmitPersonalProjectIdeal>
>

/**
 * SWR mutation for submitting personal project idea text.
 */
export const useMutateSubmitPersonalProjectIdealSwr = () => {
    const courseId = useAppSelector((state) => state.course.entity?.id)
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const swr = useSWRMutation<
        MutateSubmitPersonalProjectIdealResult,
        Error,
        string,
        SubmitPersonalProjectIdealRequest
    >(
        "MUTATE_SUBMIT_PERSONAL_PROJECT_IDEAL_SWR",
        async (_key, { arg }) => {
            if (!authenticated) {
                throw new Error("Not authenticated")
            }
            if (!courseId) {
                throw new Error("Course id not found")
            }
            return mutateSubmitPersonalProjectIdeal({
                request: arg,
                headers: {
                    [GraphQLHeadersKey.XCourseId]: courseId,
                },
            })
        },
    )
    return swr
}
