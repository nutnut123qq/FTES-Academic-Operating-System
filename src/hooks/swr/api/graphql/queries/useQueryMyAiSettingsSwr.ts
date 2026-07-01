import useSWR from "swr"
import { queryMyAiSettings } from "@/modules/api/graphql/queries/query-my-ai-settings"
import { useAppSelector } from "@/redux/hooks"

/**
 * SWR query wrapper for {@link queryMyAiSettings}. `data` is the unwrapped
 * settings payload (or `null` when absent). User-scoped — only runs once the
 * viewer is authenticated.
 */
export const useQueryMyAiSettingsSwr = () => {
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const swr = useSWR(
        authenticated ? ["QUERY_MY_AI_SETTINGS_SWR"] : null,
        async () => {
            const data = await queryMyAiSettings({})

            if (!data || !data.data) {
                throw new Error("Failed to fetch AI settings")
            }

            return data.data.myAiSettings?.data ?? null
        },
    )

    return swr
}
