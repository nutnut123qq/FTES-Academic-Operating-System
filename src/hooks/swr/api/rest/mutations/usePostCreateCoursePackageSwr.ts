import useSWRMutation from "swr/mutation"
import {
    createCoursePackage,
    type CreatePackageRequest,
    type PackageView,
} from "@/modules/api/rest/course"

/**
 * Params for {@link usePostCreateCoursePackageSwr}.
 */
export interface CreateCoursePackageParams {
    id: string
    request: CreatePackageRequest
}

/**
 * SWR mutation wrapper for {@link createCoursePackage}.
 */
export const usePostCreateCoursePackageSwr = () => {
    const swr = useSWRMutation<
        PackageView,
        Error,
        string,
        CreateCoursePackageParams
    >(
        "POST_CREATE_COURSE_PACKAGE_SWR",
        async (_key, { arg }) => {
            return createCoursePackage(arg.id, arg.request)
        },
    )

    return swr
}
