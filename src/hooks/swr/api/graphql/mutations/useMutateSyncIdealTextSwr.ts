import useSWRMutation from "swr/mutation"
import { GraphQLHeadersKey } from "@/modules/api/graphql/types"
import { mutateSyncIdealText } from "@/modules/api/graphql/mutations/mutation-sync-ideal-text"
import { type SyncIdealTextRequest } from "@/modules/api/graphql/mutations/types/sync-ideal-text"
import { useAppSelector } from "@/redux/hooks"

type MutateSyncIdealTextResult = Awaited<
    ReturnType<typeof mutateSyncIdealText>
>

/**
 * SWR mutation for {@link mutateSyncIdealText} (`X-Course-Id` from Redux).
 */
export const useMutateSyncIdealTextSwr = () => {
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const courseId = useAppSelector((state) => state.course.entity?.id)
    const swr = useSWRMutation<
        MutateSyncIdealTextResult,
        Error,
        string,
        SyncIdealTextRequest
    >(
        "MUTATE_SYNC_IDEAL_TEXT_SWR",
        async (_key, { arg }) => {
            if (!authenticated) {
                throw new Error("Not authenticated")
            }
            if (!courseId) {
                throw new Error("Course id not found")
            }
            return mutateSyncIdealText({
                request: arg,
                headers: {
                    [GraphQLHeadersKey.XCourseId]: courseId,
                },
            })
        },
    )
    return swr
}
