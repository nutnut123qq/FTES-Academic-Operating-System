"use client"

import useSWR from "swr"
import {
    listLinkedResources,
    type GroupResourceLink,
} from "@/modules/api/rest/group"

/**
 * SWR query wrapper for {@link listLinkedResources}.
 */
export const useGetGroupResourcesSwr = (id: string) => {
    const swr = useSWR<GroupResourceLink[], Error>(
        ["GET_GROUP_RESOURCES_SWR", id],
        () => listLinkedResources(id),
    )

    return swr
}
