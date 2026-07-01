import useSWR from "swr"
import { queryOpenToWorkUsers } from "@/modules/api/graphql/queries/query-open-to-work-users"

/** Talent-directory page size. */
const PAGE_LIMIT = 24

/**
 * SWR hook for the "open to work" talent directory. Public — works for anonymous
 * viewers. Returns the page of users (empty array on absent data).
 *
 * @param offset - rows to skip (offset pagination); defaults to 0
 * @returns the SWR handle (data = array of open-to-work users)
 */
export const useQueryOpenToWorkUsersSwr = (offset = 0) => {
    const swr = useSWR(
        ["QUERY_OPEN_TO_WORK_USERS_SWR", offset],
        async () => {
            const data = await queryOpenToWorkUsers({
                request: {
                    limit: PAGE_LIMIT,
                    offset,
                },
            })
            if (!data || !data.data) {
                throw new Error("Failed to fetch open-to-work users")
            }
            return data.data.openToWorkUsers?.data ?? []
        },
    )
    return swr
}
