import useSWR from "swr"
import { queryMyCourses } from "@/modules/api/graphql/queries/query-my-courses"
import type { QueryMyDashboardMilestoneProgressItemData } from "@/modules/api/graphql/queries/types/my-dashboard"
import { useAppSelector } from "@/redux/hooks"

/**
 * SWR wrapper for {@link queryMyCourses}. `data` is every joined course with its
 * milestone progress (the rail's course list), or `[]`. User-scoped — only runs
 * once the viewer is authenticated.
 */
export const useQueryMyCoursesSwr = () => {
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    return useSWR<Array<QueryMyDashboardMilestoneProgressItemData>>(
        authenticated ? ["QUERY_MY_COURSES_SWR"] : null,
        async () => {
            // unwrap the standard API envelope; empty list when absent
            const result = await queryMyCourses({})
            return result.data?.myCourses?.data ?? []
        },
    )
}
