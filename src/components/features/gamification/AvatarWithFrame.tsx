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
                // Khung ảnh 512×512 (nền trong suốt) đè lên avatar. Phải ép kích thước
                // TƯỜNG MINH theo avatar (w-[132%] + vuông + căn giữa): nếu chỉ dùng
                // `absolute -inset-[15%] max-w-none` thì `<img>` giữ kích thước gốc 512px
                // và tràn kín màn — nhánh assetUrl trước đây chưa từng chạy với ảnh thật.
                <img
                    src={frame.assetUrl}
                    alt=""
                    aria-hidden
                    className="pointer-events-none absolute left-1/2 top-1/2 aspect-square w-[132%] max-w-none -translate-x-1/2 -translate-y-1/2 object-contain"
                />
            ) : null}
        </span>
    )
}
