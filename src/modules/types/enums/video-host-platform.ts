/**
 * Where the lesson video is hosted (YouTube, Drive, etc.).
 * Stored in `lesson_videos.host_platform`.
 */
export enum VideoHostPlatform {
    /** YouTube — public or unlisted video. */
    Youtube = "youtube",
    /** Google Drive — shared MP4 or streaming link. */
    GoogleDrive = "googleDrive",
    /** Vimeo — hosted video with privacy controls. */
    Vimeo = "vimeo",
    /** Cloudflare Stream — CDN-delivered adaptive video. */
    CloudflareStream = "cloudflareStream",
    /** Any other hosting platform not explicitly listed. */
    Other = "other",
}
