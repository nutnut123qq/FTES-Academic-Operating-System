import { createAuthApolloClient } from "../clients"
import { type QueryParams } from "../types"
import { DocumentNode, gql } from "@apollo/client"
import type { QueryMyGithubTeamStatusResponse } from "./types"

const query1 = gql`
  query MyGithubTeamStatus {
    myGithubTeamStatus {
      success
      message
      error
      data {
        linked
        githubUsername
        allInTeam
        teams {
          courseId
          courseSlug
          courseTitle
          teamSlug
          state
        }
      }
    }
  }
`

export enum QueryMyGithubTeamStatus {
    Query1 = "query1",
}

const queryMap: Record<QueryMyGithubTeamStatus, DocumentNode> = {
    [QueryMyGithubTeamStatus.Query1]: query1,
}

/**
 * The viewer's GitHub link + per-enrolled-course team membership status. Drives
 * the forced "join team" gate (link and in-team are separate states).
 */
export const queryMyGithubTeamStatus = async ({
    query = QueryMyGithubTeamStatus.Query1,
    headers,
    debug,
    signal,
}: Omit<QueryParams<QueryMyGithubTeamStatus, never>, "request"> & { request?: never }) => {
    const apollo = createAuthApolloClient({
        cache: false,
        headers,
        debug,
        signal,
    })
    return apollo.query<QueryMyGithubTeamStatusResponse>({
        query: queryMap[query],
    })
}
