"use client"

import useSWR from "swr"
import {
    getPrivacySettings,
    type ProfilePrivacySettings,
} from "@/modules/api/rest/profile"

/**
 * SWR query wrapper for {@link getPrivacySettings}.
 */
export const useGetPrivacySettingsSwr = () => {
    const swr = useSWR<ProfilePrivacySettings, Error>(
        ["GET_PRIVACY_SETTINGS_SWR"],
        () => getPrivacySettings(),
    )

    return swr
}
