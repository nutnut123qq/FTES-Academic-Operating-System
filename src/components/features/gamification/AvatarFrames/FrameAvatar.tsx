"use client"

import React from "react"
import { cn } from "@heroui/react"
import { UserAvatar } from "@/components/reuseable/UserAvatar"
import { frameRingBackground } from "./model"

/** Chỉ cần bấy nhiêu để vẽ một khung — nhận cả dòng bảng lẫn bậc trong thang. */
export interface FrameLook {
    nameVi: string
    cssGradient: string
    assetUrl: string | null
}

/** Props for {@link FrameAvatar}. */
export interface FrameAvatarProps {
    username?: string | null
    avatar?: string | null
    seed?: string | null
    size?: "sm" | "md" | "lg"
    /** Khung đang đeo; `null` ⇒ vẽ avatar trần (KHÔNG vẽ khung mặc định giả). */
    frame?: FrameLook | null
    /** Xám hoá — dùng cho bậc khung CHƯA MỞ (cùng idiom badge chưa đạt). */
    dimmed?: boolean
    className?: string
}

/**
 * Avatar có vòng khung.
 *
 * Vòng viền là một lớp `background` phía sau avatar, để lộ ra một viền mỏng — nên
 * bất kỳ giá trị CSS background nào (gradient, conic, màu đặc) mà quản trị seed vào
 * `avatar_frames.css_gradient` đều vẽ được mà FE không phải deploy lại. Khung dạng
 * PNG (`asset_url`) thì chồng LÊN TRÊN avatar và vòng gradient bị bỏ qua.
 *
 * `frame == null` ⇒ avatar trần. Đừng thay bằng một khung "mặc định": người chưa mở
 * khung nào mà vẫn thấy viền thì cái viền hết là phần thưởng.
 */
export const FrameAvatar = ({
    username,
    avatar,
    seed,
    size = "md",
    frame,
    dimmed = false,
    className,
}: FrameAvatarProps) => {
    const ring = frameRingBackground(frame)

    return (
        <div className={cn("relative inline-flex shrink-0", dimmed && "opacity-60 grayscale", className)}>
            <div
                className={cn("rounded-full", frame ? "p-[2px]" : undefined)}
                style={frame && !frame.assetUrl ? { background: ring } : undefined}
            >
                <div className={cn("rounded-full", frame && !frame.assetUrl ? "bg-surface p-[1px]" : undefined)}>
                    <UserAvatar username={username} avatar={avatar} seed={seed} size={size} />
                </div>
            </div>
            {frame?.assetUrl ? (
                // <img> thuần: host của khung là bất kỳ URL nào quản trị seed nên không
                // ghim được vào remote-pattern của next/image.
                <img
                    src={frame.assetUrl}
                    alt=""
                    aria-hidden
                    className="pointer-events-none absolute inset-0 size-full scale-125 object-contain"
                />
            ) : null}
        </div>
    )
}
