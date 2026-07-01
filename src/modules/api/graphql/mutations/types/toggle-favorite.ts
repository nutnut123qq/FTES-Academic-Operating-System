import type { GraphQLResponse } from "../../types"

/** GraphQL `ToggleFavouriteRequest` body. */
export interface ToggleFavoriteRequest {
    /** Content ID to toggle favourite for. */
    contentId: string
    /** `true` = add to favorites, `false` = remove. */
    isFavorite: boolean
}

/** Payload inside `toggleFavourite.data` after the standard API wrapper. */
export interface ToggleFavoriteData {
    /** User content record ID. */
    id: string
    /** Current favourite state after toggle. */
    isFavorite: boolean
}

/** Apollo response shape for `toggleFavourite`. */
export interface MutateToggleFavoriteResponse {
    /** Top-level `toggleFavourite` field wrapping the standard API response. */
    toggleFavourite: GraphQLResponse<ToggleFavoriteData>
}
