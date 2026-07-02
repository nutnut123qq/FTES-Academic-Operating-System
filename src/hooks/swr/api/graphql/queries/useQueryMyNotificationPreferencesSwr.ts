import useSWR from "swr"
import { queryMyNotificationPreferences } from "@/modules/api/graphql/queries/query-my-notification-preferences"
import type { QueryNotificationPreferencesData } from "@/modules/api/graphql/queries/types/notification-preferences"
import { useAppSelector } from "@/redux/hooks"

/**
 * SWR wrapper for the (mock) `myNotificationPreferences` query. `data` is the
 * viewer's notification preferences (`mutedTypes` + `muteAll`) or `null`.
 * Auth-gated — only runs once authenticated. The preferences drive a
 * client-side filter over the bell, center and badge until a real backend
 * filters server-side (see the change design D5).
 */
export const useQueryMyNotificationPreferencesSwr = () => {
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    return useSWR<QueryNotificationPreferencesData | null>(
        authenticated ? ["QUERY_MY_NOTIFICATION_PREFERENCES_SWR"] : null,
        async () => {
            const result = await queryMyNotificationPreferences()
            return result.data?.myNotificationPreferences?.data ?? null
        },
    )
}
