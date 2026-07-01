import useSWR from "swr"
import { queryMyGithubTeamStatus } from "@/modules/api/graphql/queries/query-my-github-team-status"
import { useAppSelector } from "@/redux/hooks"

/**
 * SWR core for the viewer's GitHub link + team-membership status. Runs only when
 * authenticated. Drives the forced "join team" gate — it re-validates on focus so
 * accepting a GitHub invite in another tab un-blocks the app on return.
 * @returns the SWR query handle (data may be null when nothing is fetched yet).
 */
export const useQueryMyGithubTeamStatusSwr = () => {
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)

    const swr = useSWR(
        authenticated ? ["QUERY_MY_GITHUB_TEAM_STATUS_SWR"] : null,
        async () => {
            const data = await queryMyGithubTeamStatus({})

            if (!data || !data.data) {
                throw new Error("Failed to fetch GitHub team status")
            }

            return data.data.myGithubTeamStatus?.data ?? null
        },
    )

    return swr
}
