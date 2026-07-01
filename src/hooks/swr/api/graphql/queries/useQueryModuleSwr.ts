import { useParams } from "next/navigation"
import useSWR from "swr"
import { GraphQLHeadersKey } from "@/modules/api/graphql/types"
import { queryModule } from "@/modules/api/graphql/queries/query-module"
import { useAppDispatch, useAppSelector } from "@/redux/hooks"
import { setModule } from "@/redux/slices/module"

/**
 * Loads module shell (`ref/queries/modules/module`).
 * Full `contents` / `lessonVideos` / `challenges` rows come from `useQueryContentsSwr` /
 * `useQueryLessonVideosSwr` / `useQueryChallengesSwr` (list queries under `ref/queries/...`).
 */
export const useQueryModuleSwr = () => {
    const params = useParams()
    const routeModuleId = params.moduleId as string | undefined
    const enrolled = useAppSelector((state) => state.user.enrolled)
    const reduxModuleId = useAppSelector((state) => state.module.id)
    const moduleId = routeModuleId ?? reduxModuleId
    const course = useAppSelector((state) => state.course.entity)
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const dispatch = useAppDispatch()
    const swr = useSWR(
        authenticated && moduleId && course?.id
            ? [
                "QUERY_MODULE_SWR",
                moduleId,
                course.id,
                enrolled,
                authenticated,
            ]
            : null,
        async () => {
            if (!moduleId) {
                throw new Error("Module id not found")
            }
            const data = await queryModule({
                request: {
                    id: moduleId,
                },
                headers: {
                    [GraphQLHeadersKey.XCourseId]: course?.id,
                },
            })
            if (!data || !data.data) {
                throw new Error("Module not found")
            }
            dispatch(setModule(data.data.module.data))
            return data.data
        },
    )

    return swr
}
