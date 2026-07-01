"use client"

import React, { useCallback, useEffect, useRef, useState } from "react"
import { cn } from "@heroui/react"
import { VideoControls } from "../VideoControls"
import type { WithClassNames } from "@/modules/types/base/class-name"

export interface StandardPlayerProps extends WithClassNames<undefined> {
    /** Direct video URL (mp4, webm, ogg). */
    src: string
}

/**
 * Standard (MP4) video player with custom HeroUI controls.
 * Uses native `<video>` element for playback.
 */
export const StandardPlayer = ({ src, className }: StandardPlayerProps) => {
    const videoRef = useRef<HTMLVideoElement | null>(null)
    const containerRef = useRef<HTMLDivElement | null>(null)

    const [isPlaying, setIsPlaying] = useState(false)
    const [currentTime, setCurrentTime] = useState(0)
    const [duration, setDuration] = useState(0)
    const [volume, setVolume] = useState(0.5)
    const [isMuted, setIsMuted] = useState(false)
    const [hideControls, setHideControls] = useState(true)

    // ── Video element event bindings ───────────────────────────────────────
    useEffect(() => {
        const video = videoRef.current
        if (!video) return

        const onLoadedMetadata = () => setDuration(video.duration)
        const onTimeUpdate = () => setCurrentTime(video.currentTime)
        const onEnded = () => setIsPlaying(false)

        video.addEventListener("loadedmetadata", onLoadedMetadata)
        video.addEventListener("timeupdate", onTimeUpdate)
        video.addEventListener("ended", onEnded)

        return () => {
            video.removeEventListener("loadedmetadata", onLoadedMetadata)
            video.removeEventListener("timeupdate", onTimeUpdate)
            video.removeEventListener("ended", onEnded)
        }
    }, [])

    // ── Handlers ──────────────────────────────────────────────────────────
    const handlePlayPause = useCallback(() => {
        const video = videoRef.current
        if (!video) return
        if (video.paused) {
            video.play()
            setIsPlaying(true)
        } else {
            video.pause()
            setIsPlaying(false)
        }
    }, [])

    const handleSeek = useCallback((time: number) => {
        const video = videoRef.current
        if (!video) return
        video.currentTime = time
        setCurrentTime(time)
    }, [])

    const handleVolumeChange = useCallback((vol: number) => {
        const video = videoRef.current
        if (!video) return
        video.volume = vol
        setVolume(vol)
        if (vol > 0) setIsMuted(false)
    }, [])

    const handleMuteToggle = useCallback(() => {
        const video = videoRef.current
        if (!video) return
        video.muted = !video.muted
        setIsMuted(video.muted)
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
                src={src}
                playsInline
                onClick={handlePlayPause}
                aria-label="Standard video playback"
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
                hidden={hideControls}
            />
        </div>
    )
}
