import type { HlsConfig } from "hls.js"

/** Number of media fragments buffered before exposing playback controls on desktop HLS. */
export const HLS_STARTUP_SEGMENT_COUNT = 5

/**
 * A downloaded fragment is not necessarily appended/playable yet. These settings make
 * hls.js fetch while the video is still paused and leave enough byte/time headroom for at
 * least five normal lesson segments.
 */
export const HLS_STARTUP_CONFIG: Partial<HlsConfig> = {
    // Match the proven player on ftes.vn: attach MediaSource immediately, allow playback
    // as soon as fragment zero is playable, and keep fetching well beyond five segments.
    autoStartLoad: true,
    startFragPrefetch: true,
    maxBufferLength: 60,
    maxMaxBufferLength: 300,
    maxBufferSize: 120 * 1000 * 1000,
    backBufferLength: 30,
    maxBufferHole: 0.5,
    appendErrorMaxRetry: 6,
    nudgeMaxRetry: 5,
    fragLoadPolicy: {
        default: {
            maxTimeToFirstByteMs: 30000,
            maxLoadTimeMs: 240000,
            timeoutRetry: { maxNumRetry: 4, retryDelayMs: 1000, maxRetryDelayMs: 8000 },
            errorRetry: { maxNumRetry: 6, retryDelayMs: 1000, maxRetryDelayMs: 8000 },
        },
    },
    // Desktop lessons should use the mature MediaSource path. Mobile Safari takes the
    // native-HLS branch before hls.js is constructed, so this does not change mobile.
    preferManagedMediaSource: false,
}

interface HlsLevelDetailsLike {
    fragments?: Array<{ duration?: number }>
    targetduration?: number
}

export interface HlsStartupBufferPlan {
    /** Actual target count; short videos may contain fewer than five fragments. */
    segmentCount: number
    /** Minimum hls.js forward-buffer target needed to cover those fragments. */
    bufferSeconds: number
}

/**
 * Builds an exact five-fragment startup target from the loaded media playlist. The extra
 * second prevents hls.js from stopping exactly on the fourth/fifth boundary because of
 * floating-point duration rounding.
 */
export const getHlsStartupBufferPlan = (
    details: HlsLevelDetailsLike,
): HlsStartupBufferPlan => {
    const fragments = details.fragments ?? []
    const segmentCount = fragments.length > 0
        ? Math.min(HLS_STARTUP_SEGMENT_COUNT, fragments.length)
        : HLS_STARTUP_SEGMENT_COUNT
    const measuredSeconds = fragments
        .slice(0, segmentCount)
        .reduce((total, fragment) => total + Math.max(0, fragment.duration ?? 0), 0)
    const fallbackSeconds = Math.max(1, details.targetduration ?? 6) * segmentCount

    return {
        segmentCount,
        bufferSeconds: Math.ceil((measuredSeconds || fallbackSeconds) + 1),
    }
}
