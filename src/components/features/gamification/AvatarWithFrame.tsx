"use client"

import React from "react"
import { cn } from "@heroui/react"
import { UserAvatar } from "@/components/reuseable/UserAvatar"
import { useAvatarFrames } from "./useAvatarFrames"

/** Props for {@link AvatarWithFrame}. */
export interface AvatarWithFrameProps {
    username: string
    avatar: string | null
    /** Hạt giống sinh ảnh mặc định — giữ userId để cùng một người luôn ra cùng một ảnh. */
    seed: string
    size: "sm" | "md" | "lg"
    /** Mã khung viền đang đeo; `null` = không đeo ⇒ vẽ đúng như trước, không thêm gì. */
    frameCode: string | null
    /** Viền nhấn cho dòng của chính người xem. */
    highlighted?: boolean
}

/**
 * Avatar kèm KHUNG VIỀN đã mở khoá.
 *
 * <p>Đây là chỗ ĐẦU TIÊN khung viền hiện lên giao diện. Khung được cấp từ V341/V353 và mở
 * theo EXP trọn đời (giữ vĩnh viễn) hoặc theo hạng TOP MÙA (có hạn, hết kỳ sau là mất) —
 * nhưng trước đợt này chưa màn hình nào vẽ chúng, nên toàn bộ phần thưởng đó vô hình với
 * chính người được trao.
 *
 * <p><b>Khung là trang trí, KHÔNG được chen vào đường đọc.</b> Không có mã, mã lạ, hay danh
 * mục chưa tải xong đều rơi về avatar trần — không khoảng trống nhấp nháy, không thay đổi
 * kích thước hàng. Đó là lý do vòng viền vẽ bằng `ring` ở LỚP NGOÀI thay vì `padding`: thêm
 * padding sẽ đẩy mọi thứ quanh nó dịch đi vài pixel đúng lúc danh mục về, và cả bảng giật.
 *
 * <p>Khung có ảnh (`assetUrl`) thì ảnh ĐÈ LÊN trên, `pointer-events-none` để không cướp
 * click của avatar bên dưới. Khung chỉ có `cssGradient` thì vẽ bằng vòng gradient.
 */
export const AvatarWithFrame = ({
    username,
    avatar,
    seed,
    size,
    frameCode,
    highlighted = false,
}: AvatarWithFrameProps) => {
    const lookupFrame = useAvatarFrames()
    const frame = lookupFrame(frameCode)

    const avatarNode = (
        <UserAvatar
            username={username}
            avatar={avatar}
            seed={seed}
            size={size}
            className={cn(highlighted && "ring-2 ring-accent rounded-full")}
        />
    )

    if (!frame) {
        return avatarNode
    }

    return (
        <span className="relative inline-flex shrink-0">
            {frame.cssGradient ? (
                <span
                    aria-hidden
                    className="pointer-events-none absolute -inset-[3px] rounded-full"
                    style={{ background: frame.cssGradient }}
                />
            ) : null}
            <span className="relative inline-flex">{avatarNode}</span>
            {frame.assetUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                    src={frame.assetUrl}
                    alt=""
                    aria-hidden
                    className="pointer-events-none absolute -inset-[15%] max-w-none"
                />
            ) : null}
        </span>
    )
}
