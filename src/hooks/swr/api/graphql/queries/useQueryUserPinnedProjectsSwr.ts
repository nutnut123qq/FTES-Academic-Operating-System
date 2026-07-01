import useSWR from "swr"
import { queryUserPinnedProjects } from "@/modules/api/graphql/queries/query-user-pinned-projects"

/** SWR cache key prefix for the user-pinned-projects query. */
export const QUERY_USER_PINNED_PROJECTS_SWR = "QUERY_USER_PINNED_PROJECTS_SWR"

/**
 * SWR hook for a user's pinned projects by id (ordered by `orderIndex`). Public —
 * works for anonymous viewers. Returns [] on absent data; pass null/undefined
 * userId to disable the fetch.
 *
 * @param userId - id of the user whose pinned projects to fetch
 * @returns the SWR handle (data = array of pinned-project items)
 */
export const useQueryUserPinnedProjectsSwr = (userId: string | null | undefined) => {
    const swr = useSWR(
        userId ? [QUERY_USER_PINNED_PROJECTS_SWR, userId] : null,
        async () => {
            const data = await queryUserPinnedProjects({
                request: { userId: userId as string },
            })
            if (!data || !data.data) {
                throw new Error("Failed to fetch user pinned projects")
            }
            return data.data.userPinnedProjects?.data ?? []
        },
    )
    return swr
}
