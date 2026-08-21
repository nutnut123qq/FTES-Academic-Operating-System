"use client"

import React, { useDeferredValue, useState } from "react"
import Image from "next/image"
import {
    Dropdown,
    DropdownItem,
    DropdownMenu,
    DropdownPopover,
    DropdownTrigger,
    Typography,
} from "@heroui/react"
import { CaretDownIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { InfiniteScrollSentinel } from "@/components/blocks/async/InfiniteScrollSentinel"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { SearchInput } from "@/components/reuseable/SearchInput"
import { MascotMajorPicker } from "@/components/features/mascot-moments"
import { useMyMajor } from "@/components/features/profile/hooks/useMyMajor"
import { useQueryMajorsSwr } from "../hooks/useQueryMajorsSwr"
import {
    SUBJECT_SEMESTERS,
    useQuerySubjectsSwr,
    type SubjectSemesterFilter,
} from "../hooks/useQuerySubjectsSwr"
import type { Subject } from "../hooks/useQuerySubjectSwr"

/** `next/image` sizes matching the 1 / 2 / 3-column catalog grid. */
const THUMBNAIL_SIZES = "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"

/**
 * Subject catalog (§3) — the `/subjects` list. Mirrors the house catalog archetype
 * (see `CourseCatalog`): the shared {@link SearchInput} + bộ lọc NGÀNH + KỲ HỌC + a grid
 * of subject cards linking into each subject workspace. Data is REAL —
 * `useQuerySubjectsSwr` reads `GET /api/v1/subjects`.
 *
 * <p>CẢ BA bộ lọc (ngành · kỳ · tìm kiếm) chạy SERVER-SIDE và lưới nạp thêm theo trang: catalog
 * đã seed đủ môn của FPT (~400) nên bản cũ — tải một trang 100 rồi lọc bằng JavaScript — cắt cụt
 * danh sách mà không có dấu hiệu nào.
 *
 * <p>Dropdown ngành phẳng theo đúng thứ tự BE trả (khối ngành rồi tới chuyên ngành của khối đó),
 * chuyên ngành thụt lề. Chọn KHỐI = xem cả chuyên ngành con, việc gộp do BE làm.
 */
export const SubjectCatalog = () => {
    const t = useTranslations("subjects")
    const { majors } = useQueryMajorsSwr()
    const { majorCode: myMajor } = useMyMajor()
    const [query, setQuery] = useState("")
    // `undefined` = người dùng CHƯA tự chọn trong phiên này ⇒ lấy ngành trên hồ sơ làm mặc định.
    // `"all"` = họ đã bấm "Tất cả ngành" — phải phân biệt được với "chưa chọn", nếu không thì
    // mỗi lần hồ sơ load xong lại nhảy ngược về ngành của họ và nút "Tất cả" trông như hỏng.
    const [majorFilter, setMajorFilter] = useState<string | undefined>(undefined)
    const activeMajor = majorFilter ?? myMajor ?? "all"
    const [semester, setSemester] = useState<SubjectSemesterFilter>(null)
    // Gõ tới đâu gọi BE tới đó sẽ bắn một request mỗi phím; `useDeferredValue` là cơ chế sẵn có
    // của React cho đúng việc này — không kéo thêm thư viện debounce.
    const deferredQuery = useDeferredValue(query)

    // CẢ BA bộ lọc chạy ở BE: catalog có ~400 môn nên lọc lại ở client trên một trang tải sẵn sẽ
    // cắt cụt kết quả mà không báo gì (xem useQuerySubjectsSwr).
    const { subjects, isLoading, error, hasMore, isLoadingMore, loadMore } = useQuerySubjectsSwr({
        semester,
        major: activeMajor === "all" ? null : activeMajor,
        q: deferredQuery,
    })

    // Nhãn hiển thị trên trigger của 2 dropdown lọc.
    const activeMajorLabel =
        activeMajor === "all"
            ? t("catalog.allMajors")
            : (majors.find((major) => major.code === activeMajor)?.name ?? t("catalog.allMajors"))
    const activeSemesterLabel =
        semester === null ? t("catalog.all") : t("semester", { count: semester })

    return (
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
            {/* Lời mời chọn ngành cho người mới — tự ẩn khi đã chọn / đã bỏ qua / danh mục rỗng.
                Đặt ở đây vì workplace chính là chỗ việc chọn ngành có tác dụng thấy được. */}
            <MascotMajorPicker />
            <div className="flex flex-col gap-1">
                <Typography type="h4" weight="bold">
                    {t("catalog.title")}
                </Typography>
                <Typography type="body-sm" color="muted">
                    {t("catalog.subtitle")}
                </Typography>
            </div>

            {/* search + bộ lọc kỳ — static chrome, stays outside the skeleton */}
            <div className="flex flex-col gap-3">
                {/* house search block (same one the course browse / resource hub /
                    blog list use) — a hand-rolled <input> here shipped its own,
                    squarer radius instead of the field token every other search
                    field wears */}
                <SearchInput
                    value={query}
                    onValueChange={setQuery}
                    placeholder={t("catalog.searchPlaceholder")}
                    className="sm:max-w-none"
                />
                {/* Gọn lại thành 2 dropdown: NGÀNH + KỲ (trước đây là hai hàng nút cuộn ngang).
                    Kỳ liệt kê đủ 1..9 (SUBJECT_SEMESTERS) để chọn bất kỳ kỳ nào, kể cả kỳ chưa có
                    môn (lưới trống = "kỳ này chưa có môn", không phải hỏng). */}
                <div className="flex flex-wrap gap-2">
                    {majors.length > 0 ? (
                        <Dropdown>
                            <DropdownTrigger className="cursor-pointer rounded-2xl border border-default px-3 py-2">
                                <div className="flex items-center gap-2">
                                    <span className="max-w-56 truncate text-sm font-medium">
                                        {activeMajorLabel}
                                    </span>
                                    <CaretDownIcon aria-hidden focusable="false" className="size-4" />
                                </div>
                            </DropdownTrigger>
                            <DropdownPopover className="min-w-56">
                                <DropdownMenu
                                    aria-label={t("catalog.allMajors")}
                                    onAction={(key) => setMajorFilter(String(key))}
                                >
                                    <DropdownItem key="all" id="all" textValue={t("catalog.allMajors")}>
                                        {t("catalog.allMajors")}
                                    </DropdownItem>
                                    {majors.map((major) => (
                                        <DropdownItem
                                            key={major.code}
                                            id={major.code}
                                            textValue={major.name}
                                            // Chuyên ngành thụt vào dưới khối của nó. Danh sách BE
                                            // trả về đã đúng thứ tự khối → con, nên thụt lề là đủ
                                            // để thấy cấp bậc, không cần dựng section lồng.
                                            className={major.parentCode ? "pl-6" : "font-medium"}
                                        >
                                            {major.name}
                                        </DropdownItem>
                                    ))}
                                </DropdownMenu>
                            </DropdownPopover>
                        </Dropdown>
                    ) : null}

                    <Dropdown>
                        <DropdownTrigger className="cursor-pointer rounded-2xl border border-default px-3 py-2">
                            <div className="flex items-center gap-2">
                                <span className="max-w-56 truncate text-sm font-medium">
                                    {activeSemesterLabel}
                                </span>
                                <CaretDownIcon aria-hidden focusable="false" className="size-4" />
                            </div>
                        </DropdownTrigger>
                        <DropdownPopover className="min-w-56">
                            <DropdownMenu
                                aria-label={t("catalog.all")}
                                onAction={(key) =>
                                    setSemester(key === "all" ? null : (Number(key) as SubjectSemesterFilter))
                                }
                            >
                                <DropdownItem key="all" id="all" textValue={t("catalog.all")}>
                                    {t("catalog.all")}
                                </DropdownItem>
                                {SUBJECT_SEMESTERS.map((option) => (
                                    <DropdownItem
                                        key={String(option)}
                                        id={String(option)}
                                        textValue={t("semester", { count: option })}
                                    >
                                        {t("semester", { count: option })}
                                    </DropdownItem>
                                ))}
                            </DropdownMenu>
                        </DropdownPopover>
                    </Dropdown>
                </div>
            </div>

            {/* subject grid — skeleton while loading (or errored with no data) */}
            <AsyncContent
                isLoading={isLoading || Boolean(error)}
                skeleton={
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {Array.from({ length: 6 }, (_, index) => (
                            <SubjectCardSkeleton key={index} />
                        ))}
                    </div>
                }
            >
                {subjects.length === 0 ? (
                    <Typography type="body-sm" color="muted">
                        {/* Ngành có thật nhưng chưa môn nào là trạng thái HỢP LỆ — nói đúng thế
                            thay vì "không khớp tìm kiếm", để người dùng không tưởng mình gõ sai. */}
                        {activeMajor !== "all" && query.trim() === "" && semester === null
                            ? t("catalog.emptyMajor")
                            : t("catalog.empty")}
                    </Typography>
                ) : (
                    <>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {subjects.map((subject) => (
                                <SubjectCard key={subject.id} subject={subject} />
                            ))}
                        </div>
                        {/* Cuộn tới cuối là nạp trang sau (cùng cơ chế feed cộng đồng dùng). */}
                        <InfiniteScrollSentinel
                            onReach={loadMore}
                            disabled={!hasMore || isLoadingMore}
                        />
                    </>
                )}
            </AsyncContent>
        </div>
    )
}

/** Props for {@link SubjectCard}. */
interface SubjectCardProps {
    /** The subject to render. */
    subject: Subject
}

/**
 * One catalog card: 16:9 cover thumbnail (when the subject has artwork) above the
 * identity row + chip row. `imageUrl: null` or a failed load renders today's
 * image-less layout — the code-initials badge stays the visual mark, no broken
 * glyph, no empty box.
 */
const SubjectCard = ({ subject }: SubjectCardProps) => {
    const t = useTranslations("subjects")
    // broken image → fall back to the image-less layout (spec: never show a broken glyph)
    const [imageBroken, setImageBroken] = useState(false)
    const imageUrl = imageBroken ? null : subject.imageUrl

    return (
        <Link
            href={`/subjects/${subject.id}`}
            // Cùng một bộ khung với `CatalogCourseCard` (rounded-lg + p-3 + h-full + group):
            // hai lưới này nằm cạnh nhau trong cùng sản phẩm nên thẻ môn từng bo 24px
            // trong khi thẻ khoá bo 12px trông như hai hệ thiết kế khác nhau. `h-full`
            // để các thẻ cùng hàng bằng chiều cao, không so le.
            className="group flex h-full flex-col rounded-lg border border-separator p-3 no-underline transition-colors hover:bg-default/40"
        >
            {/* cover 16:9 — INSET trong padding của thẻ và tự mang radius ở CẢ BỐN góc
                (đúng anatomy của `CatalogCourseCard`). Full-bleed + dựa vào `overflow-hidden`
                của thẻ thì chỉ bo được 2 góc TRÊN, chân ảnh vẫn vuông. Nền gradient nằm
                DƯỚI ảnh nên môn không có artwork vẫn ra một khối có thương hiệu chứ không
                phải ô trống. */}
            <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-md">
                <div
                    aria-hidden
                    className="absolute inset-0 bg-gradient-to-br from-accent/40 via-accent/20 to-accent/5"
                />
                {imageUrl !== null ? (
                    <Image
                        src={imageUrl}
                        alt={subject.name}
                        fill
                        sizes={THUMBNAIL_SIZES}
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        onError={() => setImageBroken(true)}
                    />
                ) : null}
            </div>

            <div className="flex flex-1 flex-col gap-1.5 pt-3">
                {/* Tên môn là thứ người ta quét mắt, nên nó đứng chính; mã môn thành dòng
                    phụ (khác thẻ KHOÁ HỌC — mã khoá là chuỗi máy sinh nên bị giấu hẳn, còn
                    mã môn là thứ sinh viên gọi hằng ngày). Hộp tiêu đề khoá CỨNG hai dòng
                    (min-h-14) để mọi thẻ trong một hàng bắt đầu hàng meta ở cùng độ cao —
                    tên 1 dòng mà không chốt thì kéo cả chồng nội dung lên, so le hàng xóm. */}
                <div className="flex min-h-14 flex-col">
                    <Typography weight="semibold" className="line-clamp-2">
                        {subject.name}
                    </Typography>
                    <Typography type="body-xs" color="muted" truncate>
                        {subject.code}
                    </Typography>
                </div>

                {/* Hàng meta chỉ giữ thông tin học vụ hữu ích ở catalog: tín chỉ · kỳ. */}
                <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-muted">
                    <span>{t("credits", { count: subject.credits })}</span>
                    {/* Kỳ khuyến nghị chỉ hiện khi môn có gắn kỳ — null thì ẩn, không đoán. */}
                    {subject.recommendedSemester !== null ? (
                        <>
                            <span aria-hidden>·</span>
                            <span>{t("semester", { count: subject.recommendedSemester })}</span>
                        </>
                    ) : null}
                </div>

                {/* Mô tả ngắn — 2 dòng, chỉ khi BE có trả. */}
                {subject.description ? (
                    <Typography type="body-xs" color="muted" className="line-clamp-2">
                        {subject.description}
                    </Typography>
                ) : null}
            </div>
        </Link>
    )
}

/**
 * Skeleton mirroring {@link SubjectCard}: cover 16:9, hộp tiêu đề hai dòng cứng,
 * hàng meta, hai dòng mô tả — cùng hộp, cùng tỉ lệ, cùng radius.
 */
const SubjectCardSkeleton = () => (
    <div className="flex h-full flex-col rounded-lg border border-separator p-3">
        <Skeleton className="aspect-video w-full shrink-0 rounded-md" />
        <div className="flex flex-1 flex-col gap-1.5 pt-3">
            <div className="flex min-h-14 flex-col">
                <Skeleton.Typography width="2/3" />
                <Skeleton.Typography type="body-xs" width="1/3" />
            </div>
            <div className="flex items-center gap-1.5">
                <Skeleton.Typography type="body-xs" width="1/4" />
            </div>
            <Skeleton.Typography type="body-xs" width="full" />
            <Skeleton.Typography type="body-xs" width="2/3" />
        </div>
    </div>
)
