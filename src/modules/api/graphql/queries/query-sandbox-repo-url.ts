import { createAuthApolloClient } from "../clients"
import { type QueryParams } from "../types"
import { gql } from "@apollo/client"

export interface SandboxRepoUrlRequest {
    contentId: string
}

export interface QuerySandboxRepoUrlResponse {
    sandboxRepoUrl: string
}

const query1 = gql`
  query SandboxRepoUrl($request: SandboxRepoUrlRequest!) {
    sandboxRepoUrl(request: $request)
  }
`

export enum QuerySandboxRepoUrl {
    Query1 = "Query1",
}

const queryMap = {
    [QuerySandboxRepoUrl.Query1]: query1,
}

export const querySandboxRepoUrl = async ({
    query = QuerySandboxRepoUrl.Query1,
    request,
    headers,
    debug,
    signal,
}: QueryParams<QuerySandboxRepoUrl, SandboxRepoUrlRequest>) => {
    const apollo = createAuthApolloClient({
        cache: false,
        headers,
        debug,
        signal,
    })
    return apollo.query<QuerySandboxRepoUrlResponse>({
        query: queryMap[query],
        variables: { request },
    })
}
