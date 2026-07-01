/**
 * A single selectable video quality / bitrate rendition.
 *
 * Used by the DASH player to surface adaptive bitrate options and by the
 * quality selector UI to render the picker.
 */
export interface QualityLevel {
    /** Bitrate index (0 = lowest). -1 = auto. */
    index: number
    /** Vertical resolution, e.g. 360, 720, 1080. */
    height: number
    /** Bitrate in bps. */
    bitrate: number
}
