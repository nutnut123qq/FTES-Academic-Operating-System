import { setCvUrl } from "@/redux/slices/cv-url"
import { usePathname } from "next/navigation"
import useSWR from "swr"
import { queryCvUrl } from "@/modules/api/graphql/queries/query-cv-url"
import { useAppDispatch, useAppSelector } from "@/redux/hooks"

/**
 * Fetches the presigned CV view URL for the Keycloak user and mirrors it into Redux.
 * Only fetches on the CV page (`/profile/cv`) — its only consumer is the CV layout.
 */
export const useQueryCvUrlSwr = () => {
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const pathname = usePathname()
    const onCvPage = pathname.includes("/profile/cv")
    const dispatch = useAppDispatch()
    const swr = useSWR(
        authenticated && onCvPage
            ? [
                "QUERY_CV_URL_SWR",
                authenticated,
            ]
            : null,
        async () => {
            const response = await queryCvUrl({
                debug: false,
            })
            const wrapped = response.data?.cvUrl
            if (!wrapped) {
                throw new Error("CV URL query failed")
            }
            if (!wrapped.success) {
                throw new Error(wrapped.error || wrapped.message || "CV URL query failed")
            }
            dispatch(setCvUrl(wrapped.data ?? null))
            return wrapped.data ?? null
        },
    )

    return swr
}
