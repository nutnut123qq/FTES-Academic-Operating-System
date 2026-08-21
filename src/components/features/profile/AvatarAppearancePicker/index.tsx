"use client"

import React, { useState } from "react"
import { Typography, cn } from "@heroui/react"
import { CheckIcon, LockSimpleIcon, ProhibitIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import useSWR from "swr"
import { getSelfProfile, setDefaultAvatar, updateSelfProfile } from "@/modules/api/rest/profile"
import type { AvatarFrameView, DefaultAvatarView, SelfProfile } from "@/modules/api/rest/profile"
import { useSelfProfileKey } from "@/components/features/profile/hooks/useQueryProfileSwr"
import { useAppearanceCatalogSwr } from "@/components/features/profile/hooks/useAppearanceCatalogSwr"
import { UserAvatar } from "@/components/reuseable/UserAvatar"
import { AvatarWithFrame } from "@/components/features/gamification/AvatarWithFrame"
import { AchievementArt } from "@/components/features/gamification/EquippedAchievement"
import { useBadgeLabel } from "@/components/features/gamification/useBadgeLabel"
import { useGetBadgeCatalogSwr } from "@/hooks/swr/api/rest/queries/useGetBadgeCatalogSwr"
import { useRestWithToast } from "@/modules/toast/hooks"

/** Sentinel `pending` marker for the "no frame" tile (an empty code means "clear"). */
const FRAME_NONE = "__frame_none__"

/**
 * Sentinel `pending` marker for the "no achievement" tile — anh em của {@link FRAME_NONE}.
 * Chỉ dùng để đánh dấu ô nào đang bận; thứ THẬT SỰ gửi lên backend là chuỗi RỖNG.
 */
const ACHIEVEMENT_NONE = "__achievement_none__"

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
 * <p>Từ đợt này màn hình còn là chỗ chọn THÀNH TÍCH ghim sau tên — thầy yêu cầu "cũng cho
 * nó setup trong cái phần setup khung luôn": khung viền và con dấu thành tích đều là đồ
 * trang trí đeo lên danh tính, tách ra hai màn khác nhau chỉ khiến không ai tìm thấy.
 *
 * <p>Mỗi lần bấm là ÁP NGAY (khác nút Lưu của form chữ): chọn ảnh ⇒ `PUT /me/avatar/default`,
 * chọn khung ⇒ `PATCH /me {avatarFrame}`, chọn thành tích ⇒ `PATCH /me {equippedAchievement}`
 * (chuỗi rỗng = gỡ, ở CẢ HAI trường). Cả ba trả về hồ sơ mới, nạp thẳng vào cache dùng chung
 * ({@link useSelfProfileKey}) nên avatar trên navbar + ô xem trước đổi tức thì, không cần
 * GET lại.
 *
 * <p>Danh mục rỗng (BE chưa seed / chưa deploy) ⇒ ẩn khối tương ứng, không vỡ trang.
 */
export const AvatarAppearancePicker = () => {
    const t = useTranslations("profileEdit.appearance")
    // Namespace của tab "Thành tích" — mượn ĐÚNG chuỗi "Đã đạt {earned}/{total}" tab đó đang
    // dùng thay vì thêm một key gần-giống. Hai màn nói về CÙNG một bộ sưu tập, nên chúng phải
    // nói bằng cùng một câu; hai bản dịch song song là cách chúng bắt đầu lệch nhau.
    const tCatalog = useTranslations("profile.badgeCatalog")
    const badgeLabel = useBadgeLabel()
    const runRest = useRestWithToast()
    const selfKey = useSelfProfileKey()
    const { data: profile, mutate } = useSWR(selfKey, getSelfProfile)
    const { avatars, frames } = useAppearanceCatalogSwr()
    // Danh mục thành tích (đã ĐƯỢC SẮP SẴN backend-side theo `sortOrder` rồi `code` — call
    // site KHÔNG được sắp lại). Chỉ giữ những cái ĐÃ ĐẠT: backend từ chối 400 mã chưa đạt,
    // nên bày ra một ô bấm-là-lỗi còn tệ hơn không bày.
    const { data: badgeCatalog } = useGetBadgeCatalogSwr()
    const earnedAchievements = (badgeCatalog?.items ?? []).filter((item) => item.earned)
    // HAI con số của CHÍNH response trên — không phải đếm lại tại chỗ — nên ô này in ra đúng
    // chuỗi tab "Thành tích" đang in. Đây là thứ nối hai màn lại với nhau: khối chọn chỉ bày
    // phần ĐÃ ĐẠT, nên nếu không nói tổng thì nó đọc như một bộ sưu tập khác, nhỏ hơn — đúng
    // chỗ thầy hiểu nhầm là "huy hiệu của tôi không ghim được".
    // Fallback về số ô đang bày cho backend chưa deploy hai trường này: thà "3/3" hơn "3/0".
    const earnedCount = badgeCatalog?.earnedCount ?? earnedAchievements.length
    const totalCount = badgeCatalog?.totalCount ?? earnedAchievements.length

    // The code currently being applied — disables the whole grid + marks the tile busy.
    const [pending, setPending] = useState<string | null>(null)

    if (!profile) {
        return null
    }

    const currentFrameCode = profile.avatarFrame?.code ?? null
    // `undefined` (BE chưa deploy trường này) và `null` (không ghim) CÙNG nghĩa ở đây.
    const currentAchievementCode = profile.equippedAchievement?.code ?? null

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
    const onPickAchievement = (code: string | null) =>
        apply(code ?? ACHIEVEMENT_NONE, () =>
            updateSelfProfile({ equippedAchievement: code ?? "" }),
        )

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
                        {sortByOrder(frames).map((frame: AvatarFrameView) => {
                            // Khung chưa đủ điều kiện (EXP/hạng mùa) → khoá ô: không cho bấm
                            // (tránh 400 "chưa mở khoá"), làm mờ preview + gắn ổ khoá, và hiện
                            // ĐIỀU KIỆN mở (description) làm lời nhắc ngay dưới tên.
                            const locked = frame.locked ?? false
                            return (
                                <Tile
                                    key={frame.code}
                                    selected={currentFrameCode === frame.code}
                                    disabled={pending !== null || locked}
                                    onSelect={() => onPickFrame(frame.code)}
                                    ariaLabel={
                                        locked
                                            ? `${frame.nameVi ?? frame.name} — ${frame.description ?? t("frameLocked")}`
                                            : (frame.nameVi ?? frame.name)
                                    }
                                >
                                    <span className="relative inline-flex">
                                        <span className={cn(locked && "opacity-40 grayscale")}>
                                            <AvatarWithFrame
                                                username={profile.username}
                                                avatar={profile.avatarUrl}
                                                seed={profile.userId}
                                                size="md"
                                                frameCode={frame.code}
                                            />
                                        </span>
                                        {locked ? (
                                            <span className="absolute inset-0 flex items-center justify-center">
                                                <LockSimpleIcon
                                                    className="size-5 text-foreground/80"
                                                    weight="fill"
                                                    aria-hidden
                                                    focusable="false"
                                                />
                                            </span>
                                        ) : null}
                                    </span>
                                    <Typography type="body-xs" color="muted" className="line-clamp-1">
                                        {frame.nameVi ?? frame.name}
                                    </Typography>
                                    {locked && frame.description ? (
                                        <Typography
                                            type="body-xs"
                                            color="muted"
                                            className="line-clamp-2 text-[11px] leading-tight opacity-80"
                                        >
                                            {frame.description}
                                        </Typography>
                                    ) : null}
                                </Tile>
                            )
                        })}
                    </div>
                </div>
            ) : null}

            {/* achievements — pin / clear the mark shown after your name */}
            {earnedAchievements.length > 0 ? (
                <div className="flex flex-col gap-3">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                        <Typography type="body-sm" weight="semibold">
                            {t("achievementTitle")}
                        </Typography>
                        {/* "Đã đạt X/Y" — CÙNG chuỗi, CÙNG hai con số với tab "Thành tích". */}
                        <Typography type="body-xs" color="muted">
                            {tCatalog("summary", { earned: earnedCount, total: totalCount })}
                        </Typography>
                    </div>
                    <Typography type="body-xs" color="muted">
                        {t("achievementHint")}
                    </Typography>
                    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                        {/* "no achievement" tile — gỡ ghim, đúng khuôn ô "Không viền" */}
                        <Tile
                            selected={currentAchievementCode === null}
                            disabled={pending !== null}
                            onSelect={() => onPickAchievement(null)}
                            ariaLabel={t("achievementNone")}
                        >
                            <span className="flex size-12 items-center justify-center rounded-full border border-dashed border-default text-muted">
                                <ProhibitIcon className="size-5" aria-hidden focusable="false" />
                            </span>
                            <Typography type="body-xs" color="muted" className="line-clamp-1">
                                {t("achievementNone")}
                            </Typography>
                        </Tile>
                        {earnedAchievements.map((item) => {
                            // Nhãn qua `useBadgeLabel` (bản dịch curated → tên backend → mã đã
                            // humanize) — KHÔNG tự tra `gamification.milestones.*` tại chỗ, vì
                            // một mốc seed sau bản phát hành sẽ in ra nguyên đường dẫn key.
                            const label = badgeLabel(item.code, item.name)
                            return (
                                <Tile
                                    key={item.code}
                                    selected={currentAchievementCode === item.code}
                                    disabled={pending !== null}
                                    onSelect={() => onPickAchievement(item.code)}
                                    ariaLabel={label}
                                >
                                    <span className="flex size-12 items-center justify-center">
                                        <AchievementArt achievement={item} className="size-10" />
                                    </span>
                                    {/* HAI dòng: tên thành tích dài ("Người đóng góp học liệu")
                                        bị cắt còn một dòng thì hai ô cạnh nhau đọc ra giống hệt
                                        nhau. Lưới `grid` kéo mọi ô trong CÙNG hàng cao bằng ô cao
                                        nhất, nên dòng thứ hai chỉ nới hàng nào thật sự có tên dài. */}
                                    <Typography type="body-xs" color="muted" className="line-clamp-2">
                                        {label}
                                    </Typography>
                                </Tile>
                            )
                        })}
                    </div>
                </div>
            ) : null}
        </section>
    )
}

export default AvatarAppearancePicker
