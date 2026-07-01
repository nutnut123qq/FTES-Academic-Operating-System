import useSWRMutation from "swr/mutation"
import { mutateUnpinProject } from "@/modules/api/graphql/mutations/mutation-unpin-project"
import { type UnpinProjectRequest } from "@/modules/api/graphql/mutations/types/pinned-projects"

type MutateUnpinProjectResult = Awaited<ReturnType<typeof mutateUnpinProject>>

/**
 * SWR mutation wrapper for {@link mutateUnpinProject} (Bearer from Keycloak).
 */
export const useMutateUnpinProjectSwr = () => {
    /** The SWR mutation. */
    const swr = useSWRMutation<
        MutateUnpinProjectResult,
        Error,
        string,
        UnpinProjectRequest
    >(
        "MUTATE_UNPIN_PROJECT_SWR",
        async (_key, { arg }) => {
            return mutateUnpinProject({
                request: arg,
            })
        }
    )
    /** Return the SWR mutation. */
    return swr
}
