import useSWRMutation from "swr/mutation"
import { keycloakRegister } from "@/modules/api/rest/keycloak-auth/register"
import { type KeycloakRegisterRequest, type KeycloakRegisterResponse } from "@/modules/api/rest/keycloak-auth/types"

/**
 * SWR mutation wrapper for {@link keycloakRegister}.
 */
export const usePostKeycloakRegisterSwr = () => {
    const swr = useSWRMutation<
        KeycloakRegisterResponse,
        Error,
        string,
        KeycloakRegisterRequest
    >(
        "POST_KEYCLOAK_REGISTER_SWR",
        async (_key, { arg }) => {
            return keycloakRegister(arg)
        }
    )
    return swr
}
