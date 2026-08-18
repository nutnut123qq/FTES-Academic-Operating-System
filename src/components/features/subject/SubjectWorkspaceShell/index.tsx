"use client"

import React, { useState } from "react"
import { Typography, cn } from "@heroui/react"
import {
    SquaresFourIcon,
    FolderIcon,
    TargetIcon,
    ChatCircleIcon,
    UsersIcon,
    ChartBarIcon,
    BriefcaseIcon,
} from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { usePathname, useRouter } from "@/i18n/navigation"
import { CollapsibleSidebar } from "@/components/blocks/navigation/CollapsibleSidebar"
import { SidebarNavGroup } from "@/components/blocks/navigation/SidebarNavGroup"
import { SidebarNavItem } from "@/components/blocks/navigation/SidebarNavItem"
import { TabsCard } from "@/components/blocks/navigation/TabsCard"
import { ProgressMeter } from "@/components/blocks/stats/ProgressMeter"
import { useQuerySubjectSwr } from "../hooks/useQuerySubjectSwr"

/** Props for {@link SubjectWorkspaceShell}. */
interface SubjectWorkspaceShellProps {
    /** The `[subjectId]` route segment. */
    subjectId: string
    /** The active tab page. */
    children: React.ReactNode
    /**
     * Muc rail dang mo, do NGUOI GOI chi dinh — cho cac trang muon workspace nhung
     * KHONG song duoi `/subjects/<code>/<segment>` (mot de challenge mo tu tab Thuc hanh
     * nam o `/challenges/<id>?subject=<code>`). Khong truyen thi active van suy ra tu
     * pathname nhu cu, nen moi trang trong `/subjects/...` khong doi gi.
     */
    activeSegment?: string
}

/** One nav row: i18n label key, icon, and the path segment (empty = overview root). */
interface NavItem {
    key: string
    icon: React.ReactNode
    segment: string
}

/**
 * The workspace areas grouped into 3 clusters (Không gian môn · Cộng đồng · Insight)
 * — rail v2, no Lessons (IA domain separation: learning lives in the Course module).
 *
 * No `ai` row either (removed 2026-08-11): the subject's AI tools are reached from
 * the floating FrosTES assistant instead, which deep-links into `/subjects/<id>/ai`
 * with `?tool=<key>`. The PAGE still exists — only the nav row is gone.
 */
const NAV_GROUPS: Array<{ label: string; items: Array<NavItem> }> = [
    {
        label: "space",
        items: [
            { key: "overview", icon: <SquaresFourIcon className="size-5" aria-hidden focusable="false" />, segment: "" },
            { key: "discussion", icon: <ChatCircleIcon className="size-5" aria-hidden focusable="false" />, segment: "discussion" },
            { key: "resources", icon: <FolderIcon className="size-5" aria-hidden focusable="false" />, segment: "resources" },
            { key: "practice", icon: <TargetIcon className="size-5" aria-hidden focusable="false" />, segment: "practice" },
        ],
    },
    {
        label: "community",
        items: [
            { key: "members", icon: <UsersIcon className="size-5" aria-hidden focusable="false" />, segment: "members" },
        ],
    },
    {
        label: "insight",
        items: [
            { key: "statistics", icon: <ChartBarIcon className="size-5" aria-hidden focusable="false" />, segment: "statistics" },
            { key: "career", icon: <BriefcaseIcon className="size-5" aria-hidden focusable="false" />, segment: "career" },
        ],
    },
]

/** The same rows, flattened — the mobile tab strip has no group captions. */
const NAV_ITEMS: Array<NavItem> = NAV_GROUPS.flatMap((group) => group.items)

/**
 * Subject Workspace shell (archetype A · sidebar rail — chosen 2026-07-01).
 * Facebook-group layout (2026-08-17): the page is ONE ROW — a left
 * {@link CollapsibleSidebar} that owns the whole left column top-to-bottom
 * (3 separator-divided clusters), and a right column that carries EVERYTHING
 * else: the subject identity header (cover banner + identity row) first, the
 * active tab under it. Sticky one-scroll (the body scrolls; the rail sticks
 * under the 4rem navbar).
 *
 * Before, the header spanned ABOVE both columns so the rail and the tab content
 * shared one top edge — but that made the rail a short block starting BELOW the
 * cover instead of a real left column, which is not how a group page reads.
 *
 * The cover is INSET, not full-bleed: it is centered at `max-w-4xl` with empty
 * gutters either side and is a lot taller than before (it used to be squashed to
 * 8rem/11rem, cropping the subject name out of the artwork) — the same shape a
 * Facebook group cover has.
 *
 * Under `md` the rail is dropped from the layout (not just collapsed) so the tab
 * content gets the FULL phone width; the same areas are reached from a horizontally
 * scrolling tab strip pinned above the content.
 *
 * **From `xl` the rail is OUT OF FLOW (`fixed`) and the content is centred on the
 * VIEWPORT**, the way every other page centres. While the rail was an in-flow column,
 * the content was centred in what the rail left over, so collapsing the rail 16rem → 4rem
 * slid the whole page ~6rem sideways — the one thing the reader asked not to happen.
 * Out of flow, the rail's width stops being an input to the content's position at all:
 * expanded or collapsed, the column does not move a pixel, and no state has to be mirrored
 * to keep it still.
 *
 * The price is the content cap: viewport-centred content may not run closer to the left
 * edge than the rail is wide, so the cap is `min(72rem, 100vw - 34rem)` — 16rem of rail
 * plus 1rem of air, reserved on BOTH sides. It only bites under ~1696px (at 1280px the
 * column is 46rem); from there up it is the plain 72rem every page uses. Below `xl` the
 * rail goes back to being an in-flow sticky column, because reserving 32rem of a 768px
 * tablet would leave the content 14rem wide — there the rail sits beside the content as
 * it always did.
 *
 * Feature owns data (mock subject) + active-route detection + navigation; the
 * blocks own all styling.
 *
 * @param props - {@link SubjectWorkspaceShellProps}
 */
export const SubjectWorkspaceShell = ({
    subjectId,
    children,
    activeSegment,
}: SubjectWorkspaceShellProps) => {
    const t = useTranslations("subjects")
    const router = useRouter()
    const pathname = usePathname()
    const { subject } = useQuerySubjectSwr(subjectId)
    // broken header image → initials badge (spec: never show a broken glyph);
    // keyed by src so a subject change retries its own image
    const [brokenImageUrl, setBrokenImageUrl] = useState<string | null>(null)
    const imageUrl =
        subject?.imageUrl && subject.imageUrl !== brokenImageUrl ? subject.imageUrl : null

    const base = `/subjects/${subjectId}`
    const hrefFor = (segment: string) => (segment ? `${base}/${segment}` : base)
    // ponytail: nguoi goi chi dinh thi tin nguoi goi, khong doan tu URL nua — trang o
    // ngoai cay `/subjects/...` khong co segment nao trong pathname de suy ra.
    const isActive = (segment: string) =>
        activeSegment !== undefined
            ? segment === activeSegment
            : segment
                ? pathname.startsWith(`${base}/${segment}`)
                : pathname === base
    // mobile strip is a controlled tab group → it needs the active row as a KEY
    // (falls back to overview on a page outside the rail, e.g. `/ai`)
    const activeKey = NAV_ITEMS.find((item) => isActive(item.segment))?.key ?? "overview"

    return (
        // ponytail: một hàng duy nhất — rail là CỘT TRÁI của cả trang, mọi thứ còn lại
        // (header nhận diện + tab đang mở) nằm trong cột phải.
        <div className="flex w-full">
            {/* the rail is DESKTOP-ONLY: on a phone a 16rem column (even collapsed
                to 4rem) eats the content width, so it is dropped from the layout
                entirely and the same areas ride the mobile strip below instead.
                Height stays `calc(100dvh-4rem)` — SubjectFeAlbum locks its own
                frame to that number, so changing it here would skew that page.

                ponytail: `xl:fixed` — from 1280px the rail leaves the flex row, which
                is the whole trick behind "thu rail lại thì nội dung không nhúc nhích":
                out of flow it contributes no width, so the content beside it is centred
                on the viewport and its position no longer depends on 16rem vs 4rem.
                `top-16` + `h-[calc(100dvh-4rem)]` already describe a viewport-pinned
                box, so `fixed` looks identical to the `sticky` it replaces — the page
                starts right under the 4rem sticky navbar, so even at scroll 0 the rail
                lands on the same line. Below `xl` it stays the sticky in-flow column. */}
            <div className="hidden shrink-0 md:sticky md:top-16 md:block md:h-[calc(100dvh-4rem)] xl:fixed xl:left-0">
                <CollapsibleSidebar
                    title={subject?.code ?? subjectId.toUpperCase()}
                    collapseLabel={t("collapse")}
                    expandLabel={t("expand")}
                    storageKey="subject-workspace-sidebar-collapsed"
                    className="h-full"
                >
                    {NAV_GROUPS.map((group, index) => (
                        <SidebarNavGroup
                            key={group.label}
                            label={t(`groups.${group.label}`)}
                            divider={index > 0}
                        >
                            {group.items.map((item) => (
                                <SidebarNavItem
                                    key={item.key}
                                    icon={item.icon}
                                    label={t(`nav.${item.key}`)}
                                    isActive={isActive(item.segment)}
                                    onPress={() => router.push(hrefFor(item.segment))}
                                />
                            ))}
                        </SidebarNavGroup>
                    ))}
                </CollapsibleSidebar>
            </div>

            {/* ponytail: cùng container canh giữa như mọi trang khác (PageContainer =
                `mx-auto w-full max-w-6xl`). Từ `xl` rail đã ra khỏi flow nên `mx-auto`
                ở đây canh giữa theo TÂM VIEWPORT — mở hay thu rail thì khối này đứng
                yên tại chỗ. Trần `100vw - 34rem` (16rem rail + 1rem hở, nhân đôi cho
                cân) là thứ giữ mép trái của nội dung luôn nằm ngoài rail: rộng ≥1696px
                thì trần 72rem thắng và không ảnh hưởng gì. Trang tab tự lo padding. */}
            <div className="mx-auto w-full min-w-0 max-w-6xl xl:max-w-[min(72rem,100vw_-_34rem)]">
                {/* subject identity header — cover banner (ảnh bìa) then identity row */}
                <header className={cn("border-b border-separator")}>
                    {/* CONTRACT A cover: an INSET banner (the subject's "ảnh bìa") —
                        centered at `max-w-4xl` with empty gutters either side, tall
                        enough to read the artwork (a Facebook-group cover, not a
                        full-bleed strip). A plain <img> (not next/image) so a remote
                        BE-provider host renders without a next.config
                        images.remotePatterns entry; a broken src simply drops the
                        banner and the identity row below carries the subject on its
                        own. */}
                    {imageUrl !== null && subject ? (
                        <div className="px-4 pt-4 sm:px-6">
                            <div className="mx-auto h-48 w-full max-w-4xl overflow-hidden rounded-2xl bg-default sm:h-64 lg:h-80">
                                <img
                                    src={imageUrl}
                                    alt={subject.name}
                                    className="size-full object-cover"
                                    onError={() => setBrokenImageUrl(imageUrl)}
                                />
                            </div>
                        </div>
                    ) : null}
                    {/* ponytail: initials badge removed (2026-08-17) — the title already
                        carries the code, so the chip was pure duplication; the row is a
                        plain block now instead of a 2-column flex. */}
                    <div className="p-6">
                        <div className="min-w-0">
                            <Typography type="h4" weight="bold" truncate>
                                {subject ? `${subject.code} · ${subject.name}` : subjectId}
                            </Typography>
                            <Typography type="body-sm" color="muted">
                                {subject
                                    ? `${t("credits", { count: subject.credits })} · ${t(`difficulty.${subject.difficulty}`)}`
                                    : ""}
                            </Typography>
                            {/* real per-viewer progress: GraphQL `subjectMastery.completionPct`
                                (0..100). `null` for a guest / no mastery row → no meter,
                                never a fabricated figure. Clamped defensively so a stray
                                out-of-range percent can't overflow the bar. */}
                            {subject && subject.progress !== null ? (
                                <div className="mt-1 flex items-center gap-2">
                                    <ProgressMeter
                                        value={Math.min(100, Math.max(0, subject.progress))}
                                        aria-label={t("progressLabel")}
                                        className="min-w-0 flex-1"
                                    />
                                    <Typography
                                        type="body-xs"
                                        color="muted"
                                        className="shrink-0 tabular-nums"
                                    >
                                        {Math.round(Math.min(100, Math.max(0, subject.progress)))}%
                                    </Typography>
                                </div>
                            ) : null}
                        </div>
                    </div>
                </header>

                {/* mobile replacement for the rail: the SAME rows as one underline
                    tab strip above the content, scrolling horizontally at its
                    natural width (`w-max`) instead of squeezing 7 labels into a
                    phone width — the repo's canonical overflow pattern. Labels stay
                    visible (no icons passed): an icon-only strip would be the block's
                    mobile mode, which drops the label on exactly this breakpoint. */}
                <div className="overflow-x-auto border-b border-separator px-4 md:hidden">
                    <TabsCard
                        className="w-max"
                        leftTabs={{
                            ariaLabel: t("navLabel"),
                            selectedKey: activeKey,
                            items: NAV_ITEMS.map((item) => ({
                                key: item.key,
                                label: t(`nav.${item.key}`),
                            })),
                            onSelectionChange: (key) => {
                                const next = NAV_ITEMS.find((item) => item.key === String(key))
                                if (next) {
                                    router.push(hrefFor(next.segment))
                                }
                            },
                        }}
                    />
                </div>
                {children}
            </div>
        </div>
    )
}
