/**
 * Data schema for {@link UserJourneyScene}. A journey is pure DATA — the ordered
 * stations + their world positions + a camera offset. Colours are NOT in the data:
 * the component owns the theme-token palette. Copy (labels/captions) is NOT here
 * either — it is passed into the Canvas as `labels` props (the Canvas never imports
 * next-intl, so the scene stays framework-agnostic and SSR-safe).
 */

/** The visual primitive a station renders as (its 3D shape / iconography). */
export type StationKind = "home" | "workplace" | "course" | "practice" | "outcome"

/** One journey station on the path. */
export interface JourneyStationNode {
    /** Stable id (matches the i18n station key). */
    id: string
    /** Shape/role of the station. */
    kind: StationKind
    /** World position `[x, y, z]` (stations zig-zag along +x so the path reads). */
    pos: [number, number, number]
    /** The final payoff station — emphasized (glow / success tone / larger scale). */
    payoff?: boolean
}

/** Full journey scene as plain data. */
export interface JourneySceneData {
    stations: JourneyStationNode[]
    /** Camera position = focused station + this offset (isometric-ish 3/4 view). */
    cameraOffset: [number, number, number]
}

/** Per-station display copy, resolved by the feature from i18n and passed in as props. */
export interface JourneyStationLabel {
    id: string
    /** Short station name (stepper + floating label). */
    label: string
    /** One-line caption describing the stage. */
    caption: string
}
