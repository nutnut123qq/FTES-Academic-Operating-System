import { createAuthApolloClient } from "../clients"
import { type QueryParams } from "../types"
import { DocumentNode, gql } from "@apollo/client"
import type {
    QueryActiveAdvertisementRequest,
    QueryActiveAdvertisementResponse,
} from "./types"

const query1 = gql`
  query ActiveAdvertisement($placement: AdvertisementPlacement, $courseId: String) {
    activeAdvertisement(placement: $placement, courseId: $courseId) {
      success
      message
      error
      data {
        id
        mediaType
        media
        title
        ctaText
        linkUrl
        sponsorName
      }
    }
  }
`

export enum QueryActiveAdvertisement {
    Query1 = "query1",
}

const queryMap: Record<QueryActiveAdvertisement, DocumentNode> = {
    [QueryActiveAdvertisement.Query1]: query1,
}

/**
 * Fetches the banner to show in a placement (paid first, else the internal house
 * ad), or null when none is active. `request.placement` selects the slot (defaults
 * to the dashboard right rail); `request.courseId` gives lesson placements their
 * course context so enrolled viewers are exempted server-side.
 *
 * Mirrors `activeAdvertisement` (queries/dashboard/active-advertisement).
 */
export const queryActiveAdvertisement = async ({
    query = QueryActiveAdvertisement.Query1,
    request,
    headers,
    debug,
    signal,
}: Omit<QueryParams<QueryActiveAdvertisement, QueryActiveAdvertisementRequest>, "request"> & {
    request?: QueryActiveAdvertisementRequest
}) => {
    const apollo = createAuthApolloClient({
        cache: false,
        headers,
        debug,
        signal,
    })
    return apollo.query<QueryActiveAdvertisementResponse>({
        query: queryMap[query],
        variables: {
            placement: request?.placement,
            courseId: request?.courseId,
        },
    })
}
