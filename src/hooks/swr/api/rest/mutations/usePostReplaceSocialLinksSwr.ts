import useSWRMutation from "swr/mutation"
import {
    replaceSocialLinks,
    type ProfileReplaceSocialLinksRequest,
    type SelfProfile,
} from "@/modules/api/rest/profile"

/**
 * SWR mutation wrapper for {@link replaceSocialLinks}.
 */
export const usePostReplaceSocialLinksSwr = () => {
    const swr = useSWRMutation<
        SelfProfile,
        Error,
        string,
        ProfileReplaceSocialLinksRequest
    >("POST_REPLACE_SOCIAL_LINKS_SWR", async (_key, { arg }) => {
        return replaceSocialLinks(arg)
    })

    return swr
}
