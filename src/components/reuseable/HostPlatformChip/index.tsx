"use client"

import React, { useMemo } from "react"
import { Chip, cn } from "@heroui/react"
import { useTranslations } from "next-intl"
import { GoogleDriveLogoIcon, YoutubeLogoIcon } from "@phosphor-icons/react"
// NGOẠI LỆ có chủ đích (khớp allowlist trong eslint.config.mjs): @phosphor-icons/react
// KHÔNG có VimeoLogo/CloudflareLogo, nên 2 logo này buộc phải giữ react-simple-icons.
// YouTube + Google Drive đã chuyển sang phosphor.
import {
    SiVimeo,
    SiCloudflare
} from "@icons-pack/react-simple-icons"
import { VideoHostPlatform } from "@/modules/types/enums/video-host-platform"
import type { WithClassNames } from "@/modules/types/base/class-name"

/**
 * The props for the HostPlatformChip component.
 * @param hostPlatform - The host platform of the lesson video.
 */
export interface HostPlatformChipProps extends WithClassNames<undefined> {
    /** Host platform of the lesson video. */
    hostPlatform: VideoHostPlatform
}

/**
 * A chip that displays the host platform of a lesson video.
 * @param hostPlatform - The host platform of the lesson video.
 * @returns A chip that displays the host platform of a lesson video.
 */
export const HostPlatformChip = ({ hostPlatform, className }: HostPlatformChipProps) => {
    const t = useTranslations()
    // switch case to return the icon and label
    const renderHostPlatform = () => {
        switch (hostPlatform) {
        case VideoHostPlatform.Youtube:
            return {
                icon: <YoutubeLogoIcon aria-hidden focusable="false" className="size-4" />,
                label: "videoHostPlatform.youtube",
            }
        case VideoHostPlatform.GoogleDrive:
            return {
                icon: <GoogleDriveLogoIcon aria-hidden focusable="false" className="size-4" />,
                label: "videoHostPlatform.googleDrive",
            }
        case VideoHostPlatform.Vimeo:
            return {
                icon: <SiVimeo size={16} />,
                label: "videoHostPlatform.vimeo",
            }
        case VideoHostPlatform.CloudflareStream:
            return {
                icon: <SiCloudflare size={16} />,
                label: "videoHostPlatform.cloudflareStream",
            }
        default:
            throw new Error(`Invalid host platform: ${hostPlatform}`)
        }
    }
    const { icon, label } = useMemo(() => renderHostPlatform(), [hostPlatform])
    return (
        <Chip color="accent" size="sm" variant="soft" className={cn(className)}>
            {icon}
            <Chip.Label>{t(label)}</Chip.Label>
        </Chip>
    )
}