/**
 * How the {@link VideoRenderer} should render the video.
 * Derived from `LessonVideoType` + `VideoHostPlatform` at render-time.
 */
export enum VideoRendererType {
    /** Standard MP4 — native `<video>` with custom HeroUI controls. */
    Standard = "standard",
    /** MPEG-DASH adaptive streaming — dashjs player with quality selector. */
    MpegDash = "mpegDash",
    /** YouTube embed — iframe, no custom controls. */
    Youtube = "youtube",
}
