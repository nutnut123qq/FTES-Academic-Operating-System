"use client"

import React, { useCallback, useEffect, useRef, useState } from "react"
import { cn } from "@heroui/react"
import { VideoControls, type QualityLevel } from "../VideoControls"
import type { MediaPlayerClass } from "dashjs"
import type { WithClassNames } from "@/modules/types/base/class-name"

export interface MpegDashPlayerProps extends WithClassNames<undefined> {
    /** URL pointing to an MPEG-DASH .mpd manifest. */
    src: string
}

/** One bitrate rendition reported by the legacy dashjs `getBitrateInfoListFor`. */
interface DashBitrateInfo {
    /** Index of this quality rendition (used to pin playback). */
    qualityIndex: number
    /** Pixel height of the rendition (e.g. 720). */
    height: number
    /** Encoded bitrate of the rendition, in bits per second. */
    bitrate: number
}

/** Payload of the dashjs `playbackTimeUpdated` event. */
interface DashPlaybackTimeUpdatedEvent {
    /** Current playback position, in seconds. */
    time: number
    /** Seconds remaining until the end of the stream (0 at the end). */
    timeToEnd: number
}

/**
 * Legacy dashjs quality APIs that exist at runtime but were dropped from the
 * v5 `MediaPlayerClass` typings — narrowed here so we can call them without `any`.
 */
interface DashLegacyQualityApi {
    /** Returns the available bitrate renditions for a media type (`"video"`). */
    getBitrateInfoListFor: (type: string) => Array<DashBitrateInfo>
    /** Pins playback to a specific quality index for a media type. */
    setQualityFor: (type: string, qualityIndex: number) => void
}

/**
 * MPEG-DASH adaptive video player using `dashjs`.
 * Custom HeroUI controls with quality / bitrate selector.
 *
 * Pattern based on cistudy-client-2 DashVideoPlayer.
 */
export const MpegDashPlayer = ({ src, className }: MpegDashPlayerProps) => {
    const videoRef = useRef<HTMLVideoElement | null>(null)
    const containerRef = useRef<HTMLDivElement | null>(null)
    const playerRef = useRef<MediaPlayerClass | null>(null)

    const [isPlaying, setIsPlaying] = useState(false)
    const [currentTime, setCurrentTime] = useState(0)
    const [duration, setDuration] = useState(0)
    const [volume, setVolume] = useState(0.5)
    const [isMuted, setIsMuted] = useState(false)
    const [hideControls, setHideControls] = useState(true)

    // DASH-specific
    const [qualityLevels, setQualityLevels] = useState<Array<QualityLevel>>([])
    const [selectedQuality, setSelectedQuality] = useState(-1) // -1 = auto

    // ── Initialize dashjs ─────────────────────────────────────────────────
    useEffect(() => {
        let mounted = true

        const init = async () => {
            const video = videoRef.current
            if (!video) return

            const dashjsModule = await import("dashjs")
            if (!mounted) return

            const player = dashjsModule.MediaPlayer().create()
            playerRef.current = player
            player.initialize(video, src, false)

            player.on("streamInitialized", () => {
                const bitrates = (player as unknown as DashLegacyQualityApi).getBitrateInfoListFor("video")
                setQualityLevels(
                    bitrates.map((rendition) => ({
                        index: rendition.qualityIndex,
                        height: rendition.height,
                        bitrate: rendition.bitrate,
                    })),
                )
                setDuration(player.duration())
            })

            player.on("playbackTimeUpdated", (event: DashPlaybackTimeUpdatedEvent) => {
                setCurrentTime(event.time)
                if (event.timeToEnd === 0) {
                    player.pause()
                    setIsPlaying(false)
                }
            })
        }

        init()

        return () => {
            mounted = false
            playerRef.current?.destroy()
            playerRef.current = null
        }
    }, [src])

    // ── Quality change handler ────────────────────────────────────────────
    useEffect(() => {
        const player = playerRef.current
        if (!player) return
        if (selectedQuality === -1) {
            // Auto
            player.updateSettings({
                streaming: {
                    abr: {
                        autoSwitchBitrate: { audio: true, video: true },
                    },
                },
            })
        } else {
            player.updateSettings({
                streaming: {
                    abr: {
                        autoSwitchBitrate: { audio: false, video: false },
                    },
                },
            })
            ;(player as unknown as DashLegacyQualityApi).setQualityFor("video", selectedQuality)
        }
    }, [selectedQuality])

    // ── Handlers ──────────────────────────────────────────────────────────
    const handlePlayPause = useCallback(() => {
        const player = playerRef.current
        if (!player) return
        if (isPlaying) {
            player.pause()
            setIsPlaying(false)
        } else {
            player.play()
            setIsPlaying(true)
        }
    }, [isPlaying])

    const handleSeek = useCallback((time: number) => {
        const player = playerRef.current
        if (!player) return
        player.seek(time)
        setCurrentTime(time)
    }, [])

    const handleVolumeChange = useCallback((vol: number) => {
        const player = playerRef.current
        if (!player) return
        player.setVolume(vol)
        setVolume(vol)
        if (vol > 0) setIsMuted(false)
    }, [])

    const handleMuteToggle = useCallback(() => {
        const player = playerRef.current
        if (!player) return
        const next = !isMuted
        player.setMute(next)
        setIsMuted(next)
    }, [isMuted])

    const handleQualityChange = useCallback((index: number) => {
        setSelectedQuality(index)
    }, [])

    const handleFullscreen = useCallback(() => {
        const el = containerRef.current
        if (!el) return
        if (document.fullscreenElement) {
            document.exitFullscreen()
        } else {
            el.requestFullscreen()
        }
    }, [])

    return (
        <div
            ref={containerRef}
            className={cn("relative aspect-video overflow-hidden rounded-large bg-black", className)}
            onMouseEnter={() => setHideControls(false)}
            onMouseLeave={() => setHideControls(true)}
        >
            <video
                ref={videoRef}
                className="h-full w-full object-contain"
                playsInline
                onClick={handlePlayPause}
                aria-label="MPEG-DASH playback"
            />
            <VideoControls
                isPlaying={isPlaying}
                currentTime={currentTime}
                duration={duration}
                volume={volume}
                isMuted={isMuted}
                onPlayPause={handlePlayPause}
                onSeek={handleSeek}
                onVolumeChange={handleVolumeChange}
                onMuteToggle={handleMuteToggle}
                onFullscreen={handleFullscreen}
                qualityLevels={qualityLevels}
                selectedQuality={selectedQuality}
                onQualityChange={handleQualityChange}
                hidden={hideControls}
            />
        </div>
    )
}
