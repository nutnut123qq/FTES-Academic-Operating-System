import { useLocale } from "next-intl"
import { usePathname } from "next/navigation"
import useSWR from "swr"
import { GraphQLHeadersKey } from "@/modules/api/graphql/types"
import { queryHeadhuntingCompanies } from "@/modules/api/graphql/queries/query-headhunting-companies"
import { useAppDispatch, useAppSelector } from "@/redux/hooks"
import { setHeadhunterCompanies } from "@/redux/slices/headhunter"

/**
 * Lists headhunting companies via `headhuntingCompanies` and stores them in Redux.
 * Only fetches on the headhunting pages.
 */
export const useQueryHeadhunterCompaniesSwr = () => {
    const locale = useLocale()
    const pathname = usePathname()
    const onHeadhuntingPage = pathname.includes("headhunting")
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const enrolled = useAppSelector((state) => state.user.enrolled)
    const dispatch = useAppDispatch()

    return useSWR(
        authenticated && enrolled && onHeadhuntingPage
            ? [
                "QUERY_HEADHUNTING_COMPANIES_SWR",
                locale,
                enrolled,
                authenticated,
            ]
            : null,
        async () => {
            const response = await queryHeadhuntingCompanies({
                headers: {
                    [GraphQLHeadersKey.XLocale]: locale,
                },
            })

            const wrapped = response.data?.headhuntingCompanies
            if (!wrapped) {
                throw new Error("Headhunting companies not found")
            }
            if (!wrapped.success) {
                throw new Error(
                    wrapped.error || wrapped.message || "Headhunting companies not found",
                )
            }

            const payload = wrapped.data ?? []
            dispatch(setHeadhunterCompanies(payload))
            return payload
        },
    )
}
