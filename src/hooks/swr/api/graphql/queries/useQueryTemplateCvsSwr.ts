import { useLocale } from "next-intl"
import { usePathname } from "next/navigation"
import useSWR from "swr"
import { GraphQLHeadersKey } from "@/modules/api/graphql/types"
import { queryTemplateCvs } from "@/modules/api/graphql/queries/query-template-cvs"
import { useAppDispatch } from "@/redux/hooks"
import { setTemplateCvs } from "@/redux/slices/template-cvs"

/**
 * SWR query core for the template CVs query.
 * Only fetches on the CV page (`/profile/cv`) — its only consumer is `CVUpload`.
 * Previously fetched on EVERY page (without even an auth gate).
 * @returns the SWR query handle.
 */
export const useQueryTemplateCvsSwr = () => {
    const locale = useLocale()
    const pathname = usePathname()
    const onCvPage = pathname.includes("/profile/cv")
    const dispatch = useAppDispatch()
    const swr = useSWR(
        onCvPage
            ? [
                "QUERY_TEMPLATE_CVS_SWR",
                locale,
            ]
            : null,
        async () => {
            const response = await queryTemplateCvs({
                debug: false,
                headers: {
                    [GraphQLHeadersKey.XLocale]: locale,
                },
            })

            const wrapped = response.data?.templateCvs
            if (!wrapped) {
                throw new Error("Template CVs not found")
            }
            if (!wrapped.success) {
                throw new Error(wrapped.error || wrapped.message || "Template CVs not found")
            }
            const payload = wrapped.data ?? []
            dispatch(setTemplateCvs(payload))
            return payload
        },
    )

    return swr
}
