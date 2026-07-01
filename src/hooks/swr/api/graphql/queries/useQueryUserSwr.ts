import useSWR from "swr"
import { queryMe } from "@/modules/api/graphql/queries/query-me"
import { useAppDispatch, useAppSelector } from "@/redux/hooks"
import { setAuthenticated } from "@/redux/slices/keycloak"
import { setUser } from "@/redux/slices/user"
import { LocalStorage } from "@/modules/storage/local/storage"
import { LocalStorageId } from "@/modules/storage/local/enums/id"

/**
 * The core function to query courses with SWR.
 */
export const useQueryUserSwr = () => {
    const dispatch = useAppDispatch()
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    /** The SWR. */
    const swr = useSWR(
        ["QUERY_USER_SWR", authenticated.toString()],
        async () => {
            if (
                !LocalStorage.getItemAsString(
                    LocalStorageId.KeycloakAccessToken
                )) {
                return
            }
            /** The data. */
            const data = await queryMe(
                { 
                    debug: true,
                }
            )
            if (!data || !data.data || !data.data.me.data) {
                throw new Error("User not found")
            }
            /** Set the user. */
            dispatch(setAuthenticated(true))
            dispatch(setUser(data.data.me.data))
            /** Return the data. */
            return data.data
        }
    )
    /** Return the SWR. */
    return swr
}
