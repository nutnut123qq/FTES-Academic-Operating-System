import useSWRMutation from "swr/mutation"
import { mutateToggleFavorite } from "@/modules/api/graphql/mutations/mutation-toggle-favorite"
import { type ToggleFavoriteRequest } from "@/modules/api/graphql/mutations/types/toggle-favorite"
import { useAppSelector } from "@/redux/hooks"
import { GraphQLHeadersKey } from "@/modules/api/graphql/types"

type MutateToggleFavoriteResult = Awaited<ReturnType<typeof mutateToggleFavorite>>

/**
 * SWR mutation wrapper for {@link mutateToggleFavorite}.
 * Pass `{ contentId, isFavorite }` as arg to toggle.
 */
export const useMutateToggleFavoriteSwr = () => {
    const courseId = useAppSelector((state) => state.course.entity?.id)
    const swr = useSWRMutation<
        MutateToggleFavoriteResult,
        Error,
        string,
        ToggleFavoriteRequest
    >(
        "MUTATE_TOGGLE_FAVORITE_SWR",
        async (_key, { arg }) => {
            if (!courseId) {
                throw new Error("Course id not found")
            }
            return mutateToggleFavorite({
                request: arg,
                headers: {
                    [GraphQLHeadersKey.XCourseId]: courseId,
                },
            })
        }
    )
    return swr
}
