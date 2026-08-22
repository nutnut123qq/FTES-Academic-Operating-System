"use client"

import React from "react"
import { Avatar, AvatarFallback, AvatarImage, cn } from "@heroui/react"
import { UserIcon } from "@phosphor-icons/react"
import { avatarInitials, resolveAvatarSrc } from "@/utils/avatar"
import { profileAssetThumbnailUrl, roundProfileArtUrl } from "@/utils/profileAsset"
import { useAvatarFrames } from "@/components/features/gamification/useAvatarFrames"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link UserAvatar}. */
export interface UserAvatarProps extends WithClassNames<undefined> {
    /** Display username / name; drives the initials fallback + image alt text. */
    username?: string | null
    /** Uploaded avatar URL; when missing OR it fails to load, the chain falls through. */
    avatar?: string | null
    /**
     * Stable identity string (user id or username) seeding the GENERATED default face
     * when there is no uploaded photo. Same seed → same face, forever. Defaults to
     * {@link UserAvatarProps.username} when the caller has nothing better.
     */
    seed?: string | null
    /** HeroUI avatar size preset. */
    size?: "sm" | "md" | "lg"
    /**
     * Mã KHUNG VIỀN người này đang đeo (`profiles.avatar_frame`). Có mã + tra được danh
     * mục ⇒ vẽ khung quanh avatar (đây là lý do khung hiện ở MỌI nơi dùng UserAvatar,
     * miễn caller truyền được mã). `null`/không truyền/mã lạ/danh mục chưa tải ⇒ avatar
     * TRẦN — không thêm gì, không đổi layout (khung là trang trí, không chen đường đọc).
     */
    frameCode?: string | null
}

/**
 * Shared user avatar with ONE fallback chain, everywhere:
 *   1. the user's uploaded image (when present and it loads),
 *   2. otherwise a generated (DiceBear) face seeded deterministically by
 *      `seed ?? username` — the same person always gets the same face,
 *   3. otherwise their initials on the soft `bg-default` tile HeroUI bakes into
 *      `Avatar.Fallback` — and a neutral person glyph when there are no usable
 *      initials at all (no name, or the caller only had a raw uuid).
 *
 * ⚠️ THE TRAP THIS FEATURE CARRIES (read before debugging an avatar).
 * The generated face was deliberately REMOVED in 31b11dd (2026-08-11) and is back now
 * only because the project owner asked for it. The reason it was pulled is still true
 * and is not a style opinion: a seeded face renders for EVERY avatar-less user, so a
 * mapper that silently drops `avatarUrl` looks exactly like "this user has no photo".
 * That is what happened — `toCommunityPost`/`toPostDetail`/`toReply`/`toSubjectPost`
 * read `displayName`+`username` and threw `avatarUrl` away even though the GraphQL
 * document already selected it, and the bug hid behind pretty faces for weeks.
 * So: when someone reports "my photo does not show", DO NOT start here. Check the
 * mapper for that surface first — the uploaded url always wins over the generated one
 * (see `resolveAvatarSrc`), so a generated face means the url never arrived.
 *
 * The chain still advances on LOAD FAILURE, not just on a missing URL: Radix only
 * mounts the `<img>` once it has decoded, so a broken uploaded URL — or DiceBear being
 * unreachable — simply leaves the initials tile on screen.
 *
 * @param props - {@link UserAvatarProps}
 */
export const UserAvatar = ({ username, avatar, seed, size, className, frameCode }: UserAvatarProps) => {
    // `roundProfileArtUrl` đứng TRƯỚC bước thumbnail: album mặc định còn trỏ vào 9 file
    // `avatar-NN-*.svg` vuông bo góc cho tới khi migration V375 chạy, và cắt tròn một ô
    // vuông bo góc KHÔNG ra hình tròn — 4 góc art bo vào sâu hơn đường cắt nên lộ 4 múi
    // `bg-default`, đúng hình vuông chủ dự án chụp ở navbar. Ảnh tự tải lên / DiceBear
    // không khớp mẫu nên đi thẳng.
    const src = profileAssetThumbnailUrl(roundProfileArtUrl(resolveAvatarSrc(avatar, seed ?? username)))
    const initials = avatarInitials(username)

    const avatarNode = (
        <Avatar size={size} className={cn(className)}>
            {src ? <AvatarImage src={src} alt={username ?? ""} loading="lazy" decoding="async" /> : null}
            <AvatarFallback>
                {initials || <UserIcon aria-hidden focusable="false" className="size-1/2" />}
            </AvatarFallback>
        </Avatar>
    )

    // Không truyền mã khung ⇒ trả avatar TRẦN, KHÔNG gọi hook khung. Quan trọng: hook khung
    // dùng Redux + SWR; nếu gọi vô điều kiện thì MỌI nơi render UserAvatar (≈45 file + test)
    // bỗng phụ thuộc provider. Tách nhánh khung ra component riêng nên chỉ chỗ THẬT SỰ cần
    // khung mới chạm tới hook.
    if (!frameCode) {
        return avatarNode
    }
    return <FramedAvatar frameCode={frameCode}>{avatarNode}</FramedAvatar>
}

/**
 * Bọc KHUNG VIỀN quanh một avatar đã dựng. Tách riêng để {@link useAvatarFrames} (Redux +
 * SWR) CHỈ chạy khi caller thật sự truyền `frameCode` — avatar trần không gánh phụ thuộc.
 *
 * <p>Khung là trang trí, vẽ ở LỚP NGOÀI bằng ring/overlay (không đẩy layout khi danh mục về).
 * Khung có ảnh (`assetUrl`) đè lên trên — ép kích thước tường minh (`w-[132%]` + vuông + căn
 * giữa) vì ảnh khung 512×512 sẽ tràn nếu giữ kích thước gốc; chỉ có `cssGradient` thì vẽ vòng.
 * Mã lạ / danh mục chưa tải ⇒ trả avatar trần (không bọc gì).
 *
 * <p><b>`w-[132%]` là một HỢP ĐỒNG với art, không phải số chỉnh cho vừa mắt.</b> 132% đặt mép
 * avatar đúng ở bán kính 193,9 trong hộp art 512 (256 ÷ 1,32); art khung phải vẽ mép trong của
 * vòng ở r=191 để vòng tụt xuống dưới mép avatar 3 đơn vị. Vẽ hở hơn thì lộ một vành nền giữa
 * avatar và khung — đó chính là lỗi "khung không ôm avatar": bộ art chủ dự án vẽ có cỡ hở lệch
 * nhau theo hạng (191 → 218) nên bronze/silver hở rõ. Sửa ở ART (đã thu `<image>` trong 5 file
 * `frame-*-round.svg` cho mép trong về đúng 191), KHÔNG rắc mỗi hạng một tỉ lệ vào đây: một số
 * cho cả bộ thì mọi bề mặt — feed, bảng xếp hạng, navbar, màn chọn khung — cùng đúng một lần.
 *
 * <p>Đường dẫn art đi qua {@link roundProfileArtUrl} TRƯỚC khi lấy thumbnail: danh mục còn trỏ
 * vào bộ khung vuông cũ cho tới khi migration V375 chạy, và khung vuông quanh avatar tròn chính
 * là ảnh chủ dự án báo lỗi. Cả `src` lẫn nhánh dự phòng đều dùng đường đã đổi.
 */
const FramedAvatar = ({ frameCode, children }: { frameCode: string; children: React.ReactNode }) => {
    const lookupFrame = useAvatarFrames()
    const frame = lookupFrame(frameCode)
    if (!frame) {
        return <>{children}</>
    }
    const frameArtUrl = roundProfileArtUrl(frame.assetUrl)
    return (
        <span className="relative inline-flex shrink-0">
            {frame.cssGradient ? (
                <span
                    aria-hidden
                    className="pointer-events-none absolute -inset-[3px] rounded-full"
                    style={{ background: frame.cssGradient }}
                />
            ) : null}
            <span className="relative inline-flex">{children}</span>
            {frameArtUrl ? (
                <img
                    src={profileAssetThumbnailUrl(frameArtUrl) ?? frameArtUrl}
                    alt=""
                    aria-hidden
                    loading="lazy"
                    decoding="async"
                    className="pointer-events-none absolute left-1/2 top-1/2 aspect-square w-[132%] max-w-none -translate-x-1/2 -translate-y-1/2 object-contain"
                />
            ) : null}
        </span>
    )
}
