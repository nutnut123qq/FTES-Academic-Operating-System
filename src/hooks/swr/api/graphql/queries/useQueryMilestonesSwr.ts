import useSWR from "swr"
import { GraphQLHeadersKey } from "@/modules/api/graphql/types"
import { queryMilestones } from "@/modules/api/graphql/queries/query-milestones"
import { useAppSelector, useAppDispatch } from "@/redux/hooks"
import { setMilestones } from "@/redux/slices/milestone"

/**
 * SWR query core for the milestones list query.
 * @returns the SWR query handle.
 */
export const useQueryMilestonesSwr = () => {
    const course = useAppSelector((state) => state.course.entity)
    // the `milestones` query is auth-guarded, so gate the key on auth too — otherwise a hard
    // refresh fires it before the Keycloak token is ready (course loads first via a public
    // query) and the request 401s, leaving the rail + task page empty until a manual refresh
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const dispatch = useAppDispatch()
    const swr = useSWR(
        authenticated && course?.id ? ["QUERY_MILESTONES_SWR", course.id] : null,
        async () => {
            if (!course?.id) {
                throw new Error("Course ID not found")
            }
            const data = await queryMilestones({
                request: {
                    courseId: course.id,
                },
                headers: {
                    [GraphQLHeadersKey.XCourseId]: course.id,
                },
            })
            if (!data || !data.data) {
                throw new Error("Failed to fetch milestones")
            }

            if (data.data.milestones?.data?.data) {
                dispatch(setMilestones(data.data.milestones.data.data))
            }

            return data.data
        },
    )

    return swr
}
