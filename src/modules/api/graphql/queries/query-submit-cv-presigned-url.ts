import { createAuthApolloClient } from "../clients"
import { type QueryParams } from "../types"
import { DocumentNode, gql } from "@apollo/client"
import type {
    QuerySubmitCvPresignedUrlRequest,
    QuerySubmitCvPresignedUrlResponse,
} from "./types"

const query1 = gql`
  query SubmitCvPresignedUrl($request: SubmitCvPresignedUrlRequest!) {
    SubmitCvPresignedUrl(request: $request) {
      url
      cvSubmissionId
      cvSubmissionAttemptId
    }
  }
`

export enum QuerySubmitCvPresignedUrl {
  Query1 = "query1",
}

const queryMap: Record<QuerySubmitCvPresignedUrl, DocumentNode> = {
    [QuerySubmitCvPresignedUrl.Query1]: query1,
}

export const querySubmitCvPresignedUrl = async ({
    query = QuerySubmitCvPresignedUrl.Query1,
    request,
    debug,
    signal,
}: QueryParams<
  QuerySubmitCvPresignedUrl,
  QuerySubmitCvPresignedUrlRequest
>) => {
    const apollo = createAuthApolloClient({
        cache: false,
        debug,
        signal,
    })

    return apollo.query<QuerySubmitCvPresignedUrlResponse>({
        query: queryMap[query],
        variables: {
            request,
        },
        fetchPolicy: "no-cache",
    })
}
