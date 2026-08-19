"use client"

import React, { useState } from "react"
import { Button, Dropdown, Label, Modal, Typography } from "@heroui/react"
import {
    SquaresFourIcon,
    FolderIcon,
    TargetIcon,
    ChatCircleIcon,
    UsersIcon,
    ChartBarIcon,
    DotsThreeIcon,
    PushPinIcon,
    SignOutIcon,
    UserIcon,
} from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { useSearchParams } from "next/navigation"
import { usePathname, useRouter } from "@/i18n/navigation"
import { CollapsibleSidebar } from "@/components/blocks/navigation/CollapsibleSidebar"
import { SubjectWorkspaceRail } from "../SubjectWorkspaceRail"
import { SidebarNavGroup } from "@/components/blocks/navigation/SidebarNavGroup"
import { SidebarNavItem } from "@/components/blocks/navigation/SidebarNavItem"
import { TabsCard } from "@/components/blocks/navigation/TabsCard"
import { ProgressMeter } from "@/components/blocks/stats/ProgressMeter"
import { UserLink } from "@/components/features/identity"
import { useQuerySubjectSwr } from "../hooks/useQuerySubjectSwr"
import { useQuerySubjectMembersSwr } from "../hooks/useQuerySubjectMembersSwr"
import { useMutateSubjectMembershipSwr } from "../hooks/useMutateSubjectMembershipSwr"

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
            { key: "practice", icon: <TargetIcon className="size-5" aria-hidden focusable="false" />, segment: "practice" },
            { key: "resources", icon: <FolderIcon className="size-5" aria-hidden focusable="false" />, segment: "resources" },
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
        ],
    },
]

/** The same rows, flattened — the mobile tab strip has no group captions. */
const NAV_ITEMS: Array<NavItem> = NAV_GROUPS.flatMap((group) => group.items)

/** How many member avatars the identity facepile shows before the "+N" pill takes over. */
const FACEPILE_MEMBERS = 6

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
    // Facepile của hàng danh tính đọc CHÍNH hook mà tab Thành viên dùng — cùng key SWR
    // với lời gọi cũ ở rail, nên dời thẻ "Thành viên" lên header không đẻ request thứ hai.
    const { members } = useQuerySubjectMembersSwr(subjectId)
    const { leave, isLeaving } = useMutateSubjectMembershipSwr(subjectId)
    // broken header image → initials badge (spec: never show a broken glyph);
    // keyed by src so a subject change retries its own image
    const [brokenImageUrl, setBrokenImageUrl] = useState<string | null>(null)
    const [leaveOpen, setLeaveOpen] = useState(false)
    const imageUrl =
        subject?.imageUrl && subject.imageUrl !== brokenImageUrl ? subject.imageUrl : null
    const shownMembers = members.slice(0, FACEPILE_MEMBERS)
    const memberOverflow = members.length - shownMembers.length

    const base = `/subjects/${subjectId}`
    // Bộ lọc "Bài của tôi" SỐNG Ở URL (`?mine=1`), không phải state của component. Menu ⋯
    // nay đứng ở header của SHELL còn feed nằm trong tab Tổng quan (`children`) — hai cây
    // React rời nhau, nên query là kênh duy nhất nối được mà không phải dựng store; cùng
    // lối `?tool=` mà tab AI của môn đã dùng để trỏ vào một bề mặt con.
    const searchParams = useSearchParams()
    const mineFilterOn = searchParams.get("mine") === "1"
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

            {/* Nội dung ĂN HẾT khoảng giữa hai rail, không còn trần 72rem.
                `100vw - 34rem` = 17rem mỗi bên (16rem rail + 1rem hở) — đúng bằng chỗ hai
                rail chiếm, nên mép nội dung luôn dừng sát rail chứ không chui xuống dưới.
                Trần `max-w-6xl` cũ khoá ở 1152px: tại 1920 khoảng trống giữa hai rail là
                1396px nên nó bỏ phí 122px MỖI BÊN, và càng màn rộng càng phí.

                `mx-auto` giữ lại cho dải dưới `xl`: ở đó rail còn nằm trong flow nên khối
                này là một ô flex bình thường, canh giữa phần còn lại.

                ponytail: bỏ trần nghĩa là trên màn siêu rộng (≥2560px) dòng văn bản dài
                theo — đây là lựa chọn có chủ đích "chiếm toàn bộ chiều rộng". Muốn kẹp lại
                thì đặt trần MỚI ở đây, đừng trả về 72rem (nó tính theo cỡ chữ, không theo
                chỗ trống thật giữa hai rail). Trang tab tự lo padding. */}
            <div className="mx-auto w-full min-w-0 xl:max-w-[calc(100vw_-_34rem)]">
                {/* subject identity header — cover banner (ảnh bìa) then identity row */}
                <header className="border-b border-separator">
                    {/* Ảnh bìa và hàng danh tính DÙNG CHUNG đúng một khung (`p-4 sm:p-6`
                        ngoài + `mx-auto max-w-4xl` trong), nên mép trái ảnh luôn thẳng mép
                        trái tên môn ở mọi bề rộng. Trước đây ảnh có trần `max-w-4xl` + canh
                        giữa còn hàng danh tính thì không, nên màn rộng đẩy hai mép ra xa
                        nhau; padding cũng lệch (16px của ảnh so với 24px của hàng chữ). */}
                    <div className="p-4 sm:p-6">
                        <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
                            {/* CONTRACT A cover: an INSET banner (the subject's "ảnh bìa"),
                                tall enough to read the artwork (a Facebook-group cover, not
                                a full-bleed strip). A plain <img> (not next/image) so a
                                remote BE-provider host renders without a next.config
                                images.remotePatterns entry; a broken src simply drops the
                                banner and the identity row below carries the subject on its
                                own. */}
                            {imageUrl !== null && subject ? (
                                <div className="h-48 w-full overflow-hidden rounded-2xl bg-default sm:h-64 lg:h-80">
                                    <img
                                        src={imageUrl}
                                        alt={subject.name}
                                        className="size-full object-cover"
                                        onError={() => setBrokenImageUrl(imageUrl)}
                                    />
                                </div>
                            ) : null}
                            {/* ponytail: initials badge removed (2026-08-17) — the title already
                                carries the code, so the chip was pure duplication; the row is a
                                plain block now instead of a 2-column flex. */}
                            <div className="min-w-0">
                                {/* Tên môn và menu ⋯ CÙNG MỘT HÀNG (menu dời lên từ tab Tổng
                                    quan): tiêu đề nuốt hết chỗ thừa và cắt bớt khi hẹp, nút
                                    giữ nguyên cỡ ở mép phải. */}
                                <div className="flex items-center gap-3">
                                    <Typography
                                        type="h4"
                                        weight="bold"
                                        truncate
                                        className="min-w-0 flex-1"
                                    >
                                        {subject ? `${subject.code} · ${subject.name}` : subjectId}
                                    </Typography>
                                    {subject?.isMember ? (
                                        // Cùng khung ⋯ với MemberActionsMenu của tab Thành viên
                                        // (Dropdown + Button isIconOnly ghost + DotsThreeIcon),
                                        // không dựng menu riêng.
                                        <Dropdown>
                                            <Button
                                                isIconOnly
                                                size="sm"
                                                variant="ghost"
                                                className="shrink-0"
                                                aria-label={t("overview.actions")}
                                                isDisabled={isLeaving}
                                            >
                                                <DotsThreeIcon aria-hidden focusable="false" className="size-5" weight="bold" />
                                            </Button>
                                            <Dropdown.Popover>
                                                <Dropdown.Menu aria-label={t("overview.actions")}>
                                                    <Dropdown.Section>
                                                        {/* react-aria cần `id` thật, không lấy được từ React key */}
                                                        <Dropdown.Item
                                                            id="my-content"
                                                            textValue={t("overview.myContent")}
                                                            onPress={() =>
                                                                router.replace(
                                                                    mineFilterOn ? base : `${base}?mine=1`,
                                                                )
                                                            }
                                                        >
                                                            <UserIcon aria-hidden focusable="false" className="size-5" />
                                                            <Label>{t("overview.myContent")}</Label>
                                                        </Dropdown.Item>

                                                        {/* GHIM BÀI THẢO LUẬN — VÔ HIỆU HOÁ, chặn ở BE, không phải ở đây.
                                                            Cờ `Post.pinned` có thật và feed môn đã trả về, nhưng:
                                                              1. đường ghim duy nhất là POST /api/v1/admin/community/posts/{id}/pin,
                                                                 gác `access.require("admin.community.moderate")` — quyền admin
                                                                 NỀN TẢNG, không phải moderator của môn, nên thành viên bấm sẽ 403;
                                                              2. và kể cả ghim được thì bài VẪN không lên đầu: `subjectFeed` gọi thẳng
                                                                 `findSubjectFeedCursor`, câu JPQL sắp `ORDER BY p.createdAt DESC, p.id DESC`
                                                                 và không đi qua `mergePinned` như feed công khai.
                                                            Nút "chạy" mà không có tác dụng nhìn thấy được là kiểu hỏng tệ nhất, nên
                                                            mục này hiện ra kèm lý do thay vì giả vờ hoạt động. Mở khoá = việc BE. */}
                                                        <Dropdown.Item
                                                            id="pin-post"
                                                            isDisabled
                                                            textValue={t("overview.pinPost")}
                                                        >
                                                            <PushPinIcon aria-hidden focusable="false" className="size-5" />
                                                            <div className="flex min-w-0 flex-col">
                                                                <Label>{t("overview.pinPost")}</Label>
                                                                <Typography type="body-xs" color="muted">
                                                                    {t("overview.pinPostUnavailable")}
                                                                </Typography>
                                                            </div>
                                                        </Dropdown.Item>
                                                    </Dropdown.Section>
                                                    <Dropdown.Section>
                                                        {/* rời môn vẫn đi qua ĐÚNG modal xác nhận cũ */}
                                                        <Dropdown.Item
                                                            id="leave"
                                                            textValue={t("membership.leave")}
                                                            onPress={() => setLeaveOpen(true)}
                                                        >
                                                            <SignOutIcon aria-hidden focusable="false" className="size-5" />
                                                            <Label>{t("membership.leave")}</Label>
                                                        </Dropdown.Item>
                                                    </Dropdown.Section>
                                                </Dropdown.Menu>
                                            </Dropdown.Popover>
                                        </Dropdown>
                                    ) : null}
                                </div>
                                {/* Hàng nhận diện kiểu header nhóm Facebook: số thành viên + dãy
                                    avatar chồng. Thay cho dòng "tín chỉ · độ khó" cũ — hai con
                                    số đó là thuộc tính chương trình học, không nói gì về việc
                                    đây là một không gian có người ở. */}
                                {members.length > 0 ? (
                                    <div className="mt-1 flex items-center gap-3">
                                        <Typography type="body-sm" color="muted" className="shrink-0">
                                            {t("members.count", { count: members.length })}
                                        </Typography>
                                        <div className="flex items-center">
                                            {shownMembers.map((member, index) => (
                                                <UserLink
                                                    key={member.id}
                                                    username={member.username}
                                                    displayName={member.name}
                                                    hideName
                                                    size="sm"
                                                    className={index > 0 ? "-ml-2" : undefined}
                                                    classNames={{ avatar: "size-8 ring-2 ring-background" }}
                                                />
                                            ))}
                                            {memberOverflow > 0 ? (
                                                <div className="-ml-2 flex size-8 items-center justify-center rounded-full bg-default/40 text-xs text-muted ring-2 ring-background">
                                                    +{memberOverflow}
                                                </div>
                                            ) : null}
                                        </div>
                                    </div>
                                ) : null}
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

            {/* Cột PHẢI — gương của cột trái, cùng một khối định vị nên hai bên cư xử giống
                hệt nhau: `md:sticky top-16` + `h-[calc(100dvh-4rem)]` dưới `xl`, `xl:fixed
                right-0` từ 1280px trở lên để nó rời khỏi flow y như rail trái.

                KHÔNG phải nới trần bề rộng nội dung: `xl:max-w-[min(72rem,100vw-34rem)]` ở
                trên vốn đã trừ 17rem cho MỖI bên ("nhân đôi cho cân" trong docblock của nó),
                nhưng trước nay chỉ bên trái có rail — 17rem bên phải bị bỏ trống. Rail này
                rơi đúng vào chỗ đang để không, nên nội dung không hẹp đi một pixel nào.

                Ẩn dưới `md` cùng ngưỡng với rail trái: dưới đó workspace dùng tab strip
                ngang, nhét thêm một cột nữa là hết chỗ đọc.

                ponytail: rail hiện ở CẢ 7 tab và KHÔNG ẩn thẻ trùng với tab đang mở (ví dụ
                thẻ Challenges vẫn hiện khi đang ở tab Luyện tập). Rail là chỗ đứng yên để
                nhảy đi nơi khác — đổi nội dung theo tab thì nó thành một phần của trang,
                đúng thứ vừa gỡ bỏ. */}
            <div className="hidden shrink-0 md:sticky md:top-16 md:block md:h-[calc(100dvh-4rem)] xl:fixed xl:right-0">
                {/* KHÔNG có `title`: các thẻ bên trong đã tự xưng tên (Khoá học liên kết ·
                    Tài liệu mới · Challenges), nên một dòng "Lối tắt" phía trên chỉ lặp lại
                    điều mắt đã thấy. Nút thu/mở vẫn đứng nguyên chỗ cũ. */}
                <CollapsibleSidebar
                    collapseLabel={t("collapse")}
                    expandLabel={t("expand")}
                    storageKey="subject-workspace-rail-collapsed"
                    side="right"
                    className="h-full"
                >
                    <SubjectWorkspaceRail subjectId={subjectId} />
                </CollapsibleSidebar>
            </div>

            <LeaveConfirmModal
                isOpen={leaveOpen}
                subjectName={subject?.name ?? subjectId}
                isLeaving={isLeaving}
                onClose={() => setLeaveOpen(false)}
                onConfirm={() => {
                    setLeaveOpen(false)
                    void leave()
                }}
            />
        </div>
    )
}

/**
 * Confirmation before leaving the workspace — leaving drops the AI tools + member-only
 * surfaces, so it is never a one-tap action.
 */
const LeaveConfirmModal = ({
    isOpen,
    subjectName,
    isLeaving,
    onClose,
    onConfirm,
}: {
    isOpen: boolean
    subjectName: string
    isLeaving: boolean
    onClose: () => void
    onConfirm: () => void
}) => {
    const t = useTranslations("subjects")
    return (
        <Modal isOpen={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
            <Modal.Backdrop>
                <Modal.Container>
                    <Modal.Dialog className="w-full max-w-md">
                        <Modal.Header>
                            <Typography type="body" weight="bold">
                                {t("membership.leaveConfirmTitle")}
                            </Typography>
                        </Modal.Header>
                        <Modal.Body>
                            <Typography type="body-sm" color="muted">
                                {t("membership.leaveConfirmBody", { name: subjectName })}
                            </Typography>
                        </Modal.Body>
                        <Modal.Footer className="justify-end gap-2">
                            <Button variant="tertiary" onPress={onClose}>
                                {t("membership.leaveCancel")}
                            </Button>
                            <Button
                                variant="danger"
                                isDisabled={isLeaving}
                                isPending={isLeaving}
                                onPress={onConfirm}
                            >
                                {t("membership.leaveConfirm")}
                            </Button>
                        </Modal.Footer>
                    </Modal.Dialog>
                </Modal.Container>
            </Modal.Backdrop>
        </Modal>
    )
}
