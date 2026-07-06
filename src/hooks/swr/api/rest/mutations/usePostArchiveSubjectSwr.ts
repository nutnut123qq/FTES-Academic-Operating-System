import useSWRMutation from "swr/mutation"
import { archiveSubject, type SubjectDetail } from "@/modules/api/rest/subject"

/**
 * SWR mutation wrapper for {@link archiveSubject}.
 */
export const usePostArchiveSubjectSwr = () => {
    const swr = useSWRMutation<
        SubjectDetail,
        Error,
        string,
        string
    >(
        "POST_ARCHIVE_SUBJECT_SWR",
        async (_key, { arg: code }) => {
            return archiveSubject(code)
        },
    )

    return swr
}
