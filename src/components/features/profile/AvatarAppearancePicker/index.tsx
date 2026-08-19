"use client"

import React, { useState } from "react"
import { Typography, cn } from "@heroui/react"
import { CheckIcon, ProhibitIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import useSWR from "swr"
import { getSelfProfile, setDefaultAvatar, updateSelfProfile } from "@/modules/api/rest/profile"
import type { AvatarFrameView, DefaultAvatarView, SelfProfile } from "@/modules/api/rest/profile"
import { useSelfProfileKey } from "@/components/features/profile/hooks/useQueryProfileSwr"
import { useAppearanceCatalogSwr } from "@/components/features/profile/hooks/useAppearanceCatalogSwr"
import { UserAvatar } from "@/components/reuseable/UserAvatar"
import { AvatarWithFrame } from "@/components/features/gamification/AvatarWithFrame"
import { useRestWithToast } from "@/modules/toast/hooks"

/** Sentinel `pending` marker for the "no frame" tile (an empty code means "clear"). */
const FRAME_NONE = "__frame_none__"

/** One selectable tile — a soft, square, focusable button with a selected ring + check. */
const Tile = ({
    selected,
    disabled,
    onSelect,
    ariaLabel,
    children,
}: {
    selected: boolean
    disabled: boolean
    onSelect: () => void
    ariaLabel: string
    children: React.ReactNode
}) => (
    <button
        type="button"
        onClick={onSelect}
        disabled={disabled}
        aria-pressed={selected}
        aria-label={ariaLabel}
        className={cn(
            "relative flex flex-col items-center gap-1.5 rounded-2xl border p-2 transition",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
            selected ? "border-accent bg-accent/10" : "border-default hover:bg-default",
            disabled && "cursor-not-allowed opacity-60",
        )}
    >
        {children}
        {selected ? (
            <span className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-accent text-white shadow">
                <CheckIcon weight="bold" className="size-3" aria-hidden focusable="false" />
            </span>
        ) : null}
    </button>
)

/**
 * Màn CHỌN ảnh đại diện + KHUNG VIỀN cho trang chỉnh hồ sơ.
 *
 * <p>Đây là chỗ duy nhất người dùng tự đổi ảnh trong ALBUM mặc định (V341) và đeo KHUNG
 * viền đã mở khoá — trước đợt này FE chỉ có upload ảnh, không có nút chọn album/khung nào.
 *
 * <p>Mỗi lần bấm là ÁP NGAY (khác nút Lưu của form chữ): chọn ảnh ⇒ `PUT /me/avatar/default`,
 * chọn khung ⇒ `PATCH /me {avatarFrame}` (chuỗi rỗng = bỏ khung). Cả hai trả về hồ sơ mới,
 * nạp thẳng vào cache dùng chung ({@link useSelfProfileKey}) nên avatar trên navbar + ô xem
 * trước đổi tức thì, không cần GET lại.
 *
 * <p>Danh mục rỗng (BE chưa seed / chưa deploy) ⇒ ẩn khối tương ứng, không vỡ trang.
 */
export const AvatarAppearancePicker = () => {
    const t = useTranslations("profileEdit.appearance")
    const runRest = useRestWithToast()
    const selfKey = useSelfProfileKey()
    const { data: profile, mutate } = useSWR(selfKey, getSelfProfile)
    const { avatars, frames } = useAppearanceCatalogSwr()

    // The code currently being applied — disables the whole grid + marks the tile busy.
    const [pending, setPending] = useState<string | null>(null)

    if (!profile) {
        return null
    }

    const currentFrameCode = profile.avatarFrame?.code ?? null

    const apply = async (marker: string, action: () => Promise<SelfProfile>) => {
        if (pending) {
            return
        }
        setPending(marker)
        const next = await runRest(action, { showSuccessToast: true, showErrorToast: true })
        // Feed the fresh profile straight into the shared cache (no extra GET) so every
        // avatar on screen updates at once; revalidate:false because the response IS truth.
        if (next) {
            await mutate(next, { revalidate: false })
        }
        setPending(null)
    }

    const onPickAvatar = (a: DefaultAvatarView) => apply(a.code, () => setDefaultAvatar(a.code))
    const onPickFrame = (code: string | null) =>
        apply(code ?? FRAME_NONE, () => updateSelfProfile({ avatarFrame: code ?? "" }))

    const sortByOrder = <T extends { sortOrder: number }>(items: Array<T>) =>
        [...items].sort((a, b) => a.sortOrder - b.sortOrder)

    return (
        <section className="flex flex-col gap-6">
            {/* live preview: current avatar wearing the current frame */}
            <div className="flex items-center gap-4">
                <AvatarWithFrame
                    username={profile.username}
                    avatar={profile.avatarUrl}
                    seed={profile.userId}
                    size="lg"
                    frameCode={currentFrameCode}
                />
                <div className="flex flex-col">
                    <Typography type="body-sm" weight="medium">
                        {t("previewTitle")}
                    </Typography>
                    <Typography type="body-xs" color="muted">
                        {t("previewHint")}
                    </Typography>
                </div>
            </div>

            {/* album — pick a default avatar */}
            {avatars.length > 0 ? (
                <div className="flex flex-col gap-3">
                    <Typography type="body-sm" weight="semibold">
                        {t("albumTitle")}
                    </Typography>
                    <div className="grid grid-cols-4 gap-3 sm:grid-cols-6">
                        {sortByOrder(avatars).map((a) => (
                            <Tile
                                key={a.code}
                                selected={profile.defaultAvatarCode === a.code}
                                disabled={pending !== null}
                                onSelect={() => onPickAvatar(a)}
                                ariaLabel={a.nameVi ?? a.name}
                            >
                                <UserAvatar username={a.name} avatar={a.imageUrl} seed={a.code} size="md" />
                            </Tile>
                        ))}
                    </div>
                </div>
            ) : null}

            {/* frames — pick / clear a border */}
            {frames.length > 0 ? (
                <div className="flex flex-col gap-3">
                    <Typography type="body-sm" weight="semibold">
                        {t("framesTitle")}
                    </Typography>
                    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                        {/* "no frame" tile */}
                        <Tile
                            selected={currentFrameCode === null}
                            disabled={pending !== null}
                            onSelect={() => onPickFrame(null)}
                            ariaLabel={t("frameNone")}
                        >
                            <span className="flex size-12 items-center justify-center rounded-full border border-dashed border-default text-muted">
                                <ProhibitIcon className="size-5" aria-hidden focusable="false" />
                            </span>
                            <Typography type="body-xs" color="muted" className="line-clamp-1">
                                {t("frameNone")}
                            </Typography>
                        </Tile>
                        {sortByOrder(frames).map((frame: AvatarFrameView) => (
                            <Tile
                                key={frame.code}
                                selected={currentFrameCode === frame.code}
                                disabled={pending !== null}
                                onSelect={() => onPickFrame(frame.code)}
                                ariaLabel={frame.nameVi ?? frame.name}
                            >
                                <AvatarWithFrame
                                    username={profile.username}
                                    avatar={profile.avatarUrl}
                                    seed={profile.userId}
                                    size="md"
                                    frameCode={frame.code}
                                />
                                <Typography type="body-xs" color="muted" className="line-clamp-1">
                                    {frame.nameVi ?? frame.name}
                                </Typography>
                            </Tile>
                        ))}
                    </div>
                </div>
            ) : null}
        </section>
    )
}

export default AvatarAppearancePicker
