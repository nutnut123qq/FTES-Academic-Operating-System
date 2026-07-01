import type { QuickTestUrl } from "../types"
import { VideoRendererType } from "@/modules/types/enums/video-renderer-type"

/** Preset URLs offered for quick one-click testing of each renderer type. */
export const QUICK_TEST_URLS: Array<QuickTestUrl> = [
    {
        label: "DASH — Akamai test stream",
        url: "https://dash.akamaized.net/akamai/bbb_30fps/bbb_30fps.mpd",
        type: VideoRendererType.MpegDash,
    },
    {
        label: "MP4 — Big Buck Bunny",
        url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
        type: VideoRendererType.Standard,
    },
    {
        label: "YouTube — Never Gonna Give You Up",
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        type: VideoRendererType.Youtube,
    },
]
