import { useLocale } from "next-intl"
import { usePathname } from "next/navigation"
import useSWR from "swr"
import { GraphQLHeadersKey } from "@/modules/api/graphql/types"
import { defaultConsultantsListLimit, defaultConsultantsListSorts, queryConsultants } from "@/modules/api/graphql/queries/query-consultants"
import type { ConsultantEntity } from "@/modules/types/entities/consultant"
import { useAppDispatch, useAppSelector } from "@/redux/hooks"
import { setHeadhunter, setHeadhunters, setHeadhuntersCount } from "@/redux/slices/headhunter"

/**
 * Loads consultants for all companies and merges into Redux `headhunter.entities`.
 * Only fetches on the headhunting pages.
 */
export const useQueryHeadhuntersSwr = () => {
    const locale = useLocale()
    const pathname = usePathname()
    const onHeadhuntingPage = pathname.includes("headhunting")
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const enrolled = useAppSelector((state) => state.user.enrolled)
    const companies = useAppSelector((state) => state.headhunter.companies)
    const headhunterId = useAppSelector((state) => state.headhunter.headhunterId)
    const dispatch = useAppDispatch()

    const companyIdsKey = companies?.map((c) => c.id).join(",") ?? ""

    return useSWR(
        authenticated && enrolled && companies?.length && onHeadhuntingPage
            ? [
                "QUERY_CONSULTANTS_ALL_SWR",
                locale,
                companyIdsKey,
            ]
            : null,
        async () => {
            const merged: Array<ConsultantEntity> = []
            let total = 0

            for (const company of companies ?? []) {
                const response = await queryConsultants({
                    headers: {
                        [GraphQLHeadersKey.XLocale]: locale,
                    },
                    request: {
                        companyId: company.id,
                        filters: {
                            limit: defaultConsultantsListLimit,
                            pageNumber: 0,
                            sorts: defaultConsultantsListSorts,
                        },
                    },
                })

                const wrapped = response.data?.consultants
                if (!wrapped) {
                    continue
                }
                if (!wrapped.success) {
                    throw new Error(
                        wrapped.error || wrapped.message || "Consultants not found",
                    )
                }
                const payload = wrapped.data
                if (!payload) {
                    continue
                }
                total += payload.count
                merged.push(...payload.data)
            }

            merged.sort((a, b) => a.sortIndex - b.sortIndex)
            dispatch(setHeadhunters(merged))
            dispatch(setHeadhuntersCount(total))

            if (headhunterId) {
                const selected = merged.find((item) => item.id === headhunterId)
                dispatch(setHeadhunter(selected))
            }

            return merged
        },
    )
}
