import { createAuthApolloClient } from "../clients"
import { type GraphQLOperationContext, type GraphQLHeaders } from "../types"
import { DocumentNode, gql } from "@apollo/client"
import {
    AdvertisementPlacement,
    type QueryActiveAdvertisementRequest,
    type QueryActiveAdvertisementResponse,
} from "./types"

/**
 * Real BE `activeAdvertisement(placement: AdvertisementPlacement!, courseId: String):
 * Advertisement` (schema.graphqls). Returns the `Advertisement` DIRECTLY (NO
 * `{success,message,error,data}` envelope); `null` when no ad is active for the slot
 * or the viewer is exempt (enrolled, for lesson placements with a `courseId`).
 *
 * ⚠️ Gateway quirk (same as `query-community-feed.ts`, verified against apitest): the
 * pre-GraphQL security filter rejects ANY operation that declares a NON-NULL variable
 * (`$x: T!`) with a top-level 401 `PLATFORM_UNAUTHORIZED`. The schema types `placement`
 * as `AdvertisementPlacement!`, so the enum literal is INLINED per placement and only
 * the nullable `$courseId: String` is passed as a variable.
 */

/** Field selection of the BE `Advertisement` type (display fields only). */
const AD_SELECTION = `
  id
  mediaType
  media
  title
  ctaText
  linkUrl
  sponsorName
`

/** Build a document with the `placement` enum INLINED (see the non-null-variable quirk above). */
const advertisementDocument = (placement: AdvertisementPlacement): DocumentNode =>
    gql(
        "query ActiveAdvertisement($courseId: String) {\n" +
            `  activeAdvertisement(placement: ${placement}, courseId: $courseId) {${AD_SELECTION}}\n` +
            "}",
    )

/** Pre-built documents per placement (enum inlined). */
const queryMap: Record<AdvertisementPlacement, DocumentNode> = {
    [AdvertisementPlacement.DashboardRight]: advertisementDocument(AdvertisementPlacement.DashboardRight),
    [AdvertisementPlacement.LessonInterstitial]: advertisementDocument(AdvertisementPlacement.LessonInterstitial),
    [AdvertisementPlacement.CourseDetail]: advertisementDocument(AdvertisementPlacement.CourseDetail),
    [AdvertisementPlacement.LessonInline]: advertisementDocument(AdvertisementPlacement.LessonInline),
    [AdvertisementPlacement.PracticeRail]: advertisementDocument(AdvertisementPlacement.PracticeRail),
    [AdvertisementPlacement.LeaderboardRail]: advertisementDocument(AdvertisementPlacement.LeaderboardRail),
    [AdvertisementPlacement.CommunityRail]: advertisementDocument(AdvertisementPlacement.CommunityRail),
}

/** Params for {@link queryActiveAdvertisement}. */
export interface QueryActiveAdvertisementParams extends GraphQLOperationContext {
    /** Placement + optional course context; placement defaults to the dashboard right rail. */
    request?: QueryActiveAdvertisementRequest
    headers?: GraphQLHeaders
    debug?: boolean
}

/**
 * Fetches the banner to show in a placement (paid first, else the internal house
 * ad), or null when none is active. `request.placement` selects the slot (defaults
 * to the dashboard right rail); `request.courseId` gives lesson placements their
 * course context so enrolled viewers are exempted server-side.
 *
 * The BE gateway requires an authenticated session (unlike the public REST mirror
 * `GET /api/v1/advertisements/active`); community pages sit behind sign-in.
 *
 * @returns Apollo query result; the ad is at `data.activeAdvertisement` (direct, no envelope).
 */
export const queryActiveAdvertisement = async ({
    request,
    headers,
    debug,
    signal,
}: QueryActiveAdvertisementParams) => {
    const apollo = createAuthApolloClient({
        cache: false,
        headers,
        debug,
        signal,
    })
    return apollo.query<QueryActiveAdvertisementResponse>({
        query: queryMap[request?.placement ?? AdvertisementPlacement.DashboardRight],
        variables: {
            courseId: request?.courseId ?? null,
        },
    })
}
