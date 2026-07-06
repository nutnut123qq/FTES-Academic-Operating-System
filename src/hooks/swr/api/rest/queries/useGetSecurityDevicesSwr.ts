"use client"

import useSWR from "swr"
import {
    listSecurityDevices,
    type SecurityDeviceView,
} from "@/modules/api/rest/identity-security"

/**
 * SWR query wrapper for {@link listSecurityDevices}.
 */
export const useGetSecurityDevicesSwr = () => {
    const swr = useSWR<SecurityDeviceView[], Error>(
        "GET_SECURITY_DEVICES_SWR",
        () => listSecurityDevices(),
    )

    return swr
}
