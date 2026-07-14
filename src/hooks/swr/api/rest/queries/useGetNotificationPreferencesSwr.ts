"use client"

import useSWR from "swr"
import {
    getNotificationPreferences,
    toNotificationPreferencesData,
} from "@/modules/api/rest/notification"
import type { QueryNotificationPreferencesData } from "@/modules/api/graphql/queries/types/notification-preferences"
import { useAppSelector } from "@/redux/hooks"

/** Shared SWR key — bell, center and preferences surface read ONE cache. */
export const NOTIFICATION_PREFERENCES_SWR_KEY = "GET_NOTIFICATION_PREFERENCES_SWR"

/**
 * SWR query for the current user's notification preferences, backed by the
 * real BE matrix (`GET /api/v1/notifications/preferences`) and derived to the
 * FE `{mutedTypes, muteAll}` model via {@link toNotificationPreferencesData}.
 * Auth-gated — only runs once authenticated. The single source of truth for
 * the bell, the center filter and the preferences surface (shared key).
 */
export const useGetNotificationPreferencesSwr = () => {
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const swr = useSWR<QueryNotificationPreferencesData | null, Error>(
        authenticated ? [NOTIFICATION_PREFERENCES_SWR_KEY] : null,
        async () => toNotificationPreferencesData(await getNotificationPreferences()),
    )

    return swr
}
