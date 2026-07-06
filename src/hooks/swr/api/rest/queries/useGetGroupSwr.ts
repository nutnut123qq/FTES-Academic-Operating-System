"use client"

import useSWR from "swr"
import { getGroup, type GroupResponse } from "@/modules/api/rest/group"

/**
 * SWR query wrapper for {@link getGroup}.
 */
export const useGetGroupSwr = (idOrSlug: string) => {
    const swr = useSWR<GroupResponse, Error>(
        ["GET_GROUP_SWR", idOrSlug],
        () => getGroup(idOrSlug),
    )

    return swr
}
