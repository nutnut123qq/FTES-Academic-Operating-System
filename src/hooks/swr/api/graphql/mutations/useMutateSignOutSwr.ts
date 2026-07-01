
import useSWRMutation from "swr/mutation"
import { mutateSignOut } from "@/modules/api/graphql/mutations/mutation-sign-out"
import { useAppDispatch, useAppSelector } from "@/redux/hooks"
import { setAuthenticated } from "@/redux/slices/keycloak"
import { setUser } from "@/redux/slices/user"
import { LocalStorage } from "@/modules/storage/local/storage"
import { LocalStorageId } from "@/modules/storage/local/enums/id"

/**
 * SWR mutation for {@link mutateSignOut} (`X-Course-Id` from Redux).
 */
export const useMutateSignOutSwr = () => {
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const dispatch = useAppDispatch()
    const swr = useSWRMutation(
        "MUTATE_SIGN_OUT_SWR",
        async () => {
            if (!authenticated) {
                throw new Error("Not authenticated")
            }
            await mutateSignOut({
                request: undefined,
            })
            LocalStorage.removeItem(LocalStorageId.KeycloakAccessToken)
            dispatch(setUser(null))
            dispatch(setAuthenticated(false))
        },
    )
    return swr
}
