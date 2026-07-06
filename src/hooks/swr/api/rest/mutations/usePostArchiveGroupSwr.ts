import useSWRMutation from "swr/mutation"
import { archiveGroup } from "@/modules/api/rest/group"

/**
 * SWR mutation wrapper for {@link archiveGroup}.
 */
export const usePostArchiveGroupSwr = () => {
    const swr = useSWRMutation<void, Error, string, string>(
        "POST_ARCHIVE_GROUP_SWR",
        async (_key, { arg }) => {
            return archiveGroup(arg)
        },
    )

    return swr
}
