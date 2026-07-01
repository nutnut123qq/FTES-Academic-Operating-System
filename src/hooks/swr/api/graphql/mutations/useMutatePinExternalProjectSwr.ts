import useSWRMutation from "swr/mutation"
import { mutatePinExternalProject } from "@/modules/api/graphql/mutations/mutation-pin-external-project"
import { type PinExternalProjectRequest } from "@/modules/api/graphql/mutations/types/pinned-projects"

type MutatePinExternalProjectResult = Awaited<ReturnType<typeof mutatePinExternalProject>>

/**
 * SWR mutation wrapper for {@link mutatePinExternalProject} (Bearer from Keycloak).
 */
export const useMutatePinExternalProjectSwr = () => {
    /** The SWR mutation. */
    const swr = useSWRMutation<
        MutatePinExternalProjectResult,
        Error,
        string,
        PinExternalProjectRequest
    >(
        "MUTATE_PIN_EXTERNAL_PROJECT_SWR",
        async (_key, { arg }) => {
            return mutatePinExternalProject({
                request: arg,
            })
        }
    )
    /** Return the SWR mutation. */
    return swr
}
