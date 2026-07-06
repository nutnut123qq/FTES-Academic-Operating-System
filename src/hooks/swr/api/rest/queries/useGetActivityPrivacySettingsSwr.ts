"use client"

import useSWR from "swr"
import {
    getActivityPrivacySettings,
    type ActivityPrivacyOverrideView,
} from "@/modules/api/rest/activity"

/**
 * SWR query wrapper for {@link getActivityPrivacySettings}.
 */
export const useGetActivityPrivacySettingsSwr = () => {
    const swr = useSWR<ActivityPrivacyOverrideView[], Error>(
        "GET_ACTIVITY_PRIVACY_SETTINGS_SWR",
        () => getActivityPrivacySettings(),
    )

    return swr
}
