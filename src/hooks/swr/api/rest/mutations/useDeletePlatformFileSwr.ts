import useSWRMutation from "swr/mutation"
import { deletePlatformFile } from "@/modules/api/rest/platform"

/**
 * SWR mutation wrapper for {@link deletePlatformFile}.
 */
export const useDeletePlatformFileSwr = () => {
    const swr = useSWRMutation<void, Error, string, string>(
        "DELETE_PLATFORM_FILE_SWR",
        async (_key, { arg }) => {
            return deletePlatformFile(arg)
        },
    )

    return swr
}
