import useSWRMutation from "swr/mutation"
import {
    reorderCourseSections,
    type ReorderRequest,
} from "@/modules/api/rest/course"

/**
 * Params for {@link usePostReorderCourseSectionsSwr}.
 */
export interface ReorderCourseSectionsParams {
    id: string
    request: ReorderRequest
}

/**
 * SWR mutation wrapper for {@link reorderCourseSections}.
 */
export const usePostReorderCourseSectionsSwr = () => {
    const swr = useSWRMutation<
        void,
        Error,
        string,
        ReorderCourseSectionsParams
    >(
        "POST_REORDER_COURSE_SECTIONS_SWR",
        async (_key, { arg }) => {
            return reorderCourseSections(arg.id, arg.request)
        },
    )

    return swr
}
