
import useSWRMutation from "swr/mutation"
import { GraphQLHeadersKey } from "@/modules/api/graphql/types"
import { mutateRunPlaygroundPrompt } from "@/modules/api/graphql/mutations/mutation-run-playground-prompt"
import { type RunPlaygroundPromptInput } from "@/modules/api/graphql/mutations/types/run-playground-prompt"
import { useAppSelector } from "@/redux/hooks"

type MutateRunPlaygroundPromptResult = Awaited<
    ReturnType<typeof mutateRunPlaygroundPrompt>
>
/**
 * SWR mutation for {@link mutateRunPlaygroundPrompt} (`X-Course-Id` from Redux).
 */
export const useMutateRunPlaygroundPromptSwr = () => {
    const courseId = useAppSelector((state) => state.course.entity?.id)
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const swr = useSWRMutation<
        MutateRunPlaygroundPromptResult,
        Error,
        string,
        RunPlaygroundPromptInput
    >(
        "MUTATE_RUN_PLAYGROUND_PROMPT_SWR",
        async (_key, { arg }) => {
            if (!authenticated) {
                throw new Error("Not authenticated")
            }
            if (!courseId) {
                throw new Error("Course id not found")
            }
            return mutateRunPlaygroundPrompt({
                request: arg,
                headers: {
                    [GraphQLHeadersKey.XCourseId]: courseId,
                },
            })
        },
    )
    return swr
}
