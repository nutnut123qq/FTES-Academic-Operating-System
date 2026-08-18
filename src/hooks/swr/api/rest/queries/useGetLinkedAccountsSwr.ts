"use client"

import useSWR from "swr"
import { getLinkedAccounts, type LinkedAccount } from "@/modules/api/rest/identity"

/** Shared SWR key — the settings section and any revalidation after link/unlink read ONE cache. */
export const LINKED_ACCOUNTS_SWR_KEY = "GET_LINKED_ACCOUNTS_SWR"

/**
 * SWR query wrapper for {@link getLinkedAccounts}.
 */
export const useGetLinkedAccountsSwr = () => {
    const swr = useSWR<Array<LinkedAccount>, Error>(
        LINKED_ACCOUNTS_SWR_KEY,
        getLinkedAccounts,
    )

    return swr
}
