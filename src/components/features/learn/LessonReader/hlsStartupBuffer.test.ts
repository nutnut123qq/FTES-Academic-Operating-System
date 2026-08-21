import { describe, expect, it } from "vitest"
import {
    getHlsStartupBufferPlan,
    HLS_STARTUP_CONFIG,
    HLS_STARTUP_SEGMENT_COUNT,
} from "./hlsStartupBuffer"

describe("HLS startup buffer", () => {
    it("keeps at least five normal playlist segments ahead without blocking first playback", () => {
        const plan = getHlsStartupBufferPlan({
            fragments: Array.from({ length: 10 }, () => ({ duration: 6 })),
            targetduration: 6,
        })

        expect(HLS_STARTUP_SEGMENT_COUNT).toBe(5)
        expect(plan).toEqual({ segmentCount: 5, bufferSeconds: 31 })
        expect(HLS_STARTUP_CONFIG).toMatchObject({
            autoStartLoad: true,
            startFragPrefetch: true,
            maxBufferLength: 60,
            maxBufferSize: 120_000_000,
            fragLoadPolicy: {
                default: {
                    maxTimeToFirstByteMs: 30_000,
                    maxLoadTimeMs: 240_000,
                },
            },
        })
    })

    it("waits for every segment when a short video contains fewer than five", () => {
        expect(getHlsStartupBufferPlan({
            fragments: [{ duration: 4.2 }, { duration: 4.2 }, { duration: 2 }],
            targetduration: 5,
        })).toEqual({ segmentCount: 3, bufferSeconds: 12 })
    })

    it("falls back to target duration when the playlist has not exposed fragments yet", () => {
        expect(getHlsStartupBufferPlan({ targetduration: 8 })).toEqual({
            segmentCount: 5,
            bufferSeconds: 41,
        })
    })
})
