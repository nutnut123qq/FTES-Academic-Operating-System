/**
 * Video delivery format for a lesson video.
 * Stored in `lesson_videos.video_type`.
 */
export enum LessonVideoType {
    /** Standard MP4 format. */
    Standard = "standard",
    /** MPEG-DASH adaptive streaming format. */
    MpegDash = "mpegDash",
}
