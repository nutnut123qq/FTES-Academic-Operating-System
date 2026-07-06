"use client"

import useSWR from "swr"
import {
    getResourceVersions,
    type VersionResponse,
} from "@/modules/api/rest/resource"

/**
 * SWR query wrapper for {@link getResourceVersions}.
 */
export const useGetResourceVersionsSwr = (id: string) => {
    const swr = useSWR<Array<VersionResponse>, Error>(
        ["GET_RESOURCE_VERSIONS_SWR", id],
        () => getResourceVersions(id),
    )

    return swr
}
