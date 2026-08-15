"use client"

import React, { useState } from "react"
import Image from "next/image"
import { Button, Chip, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { SearchInput } from "@/components/reuseable/SearchInput"
import { MascotMajorPicker } from "@/components/features/mascot-moments"
import { useMyMajor } from "@/components/features/profile/hooks/useMyMajor"
import { useQueryMajorsSwr } from "../hooks/useQueryMajorsSwr"
import { useQuerySubjectsSwr } from "../hooks/useQuerySubjectsSwr"
import type { Subject } from "../hooks/useQuerySubjectSwr"

/** Difficulty filter options: "all" + every difficulty. */
const DIFFICULTIES: Array<Subject["difficulty"] | "all"> = ["all", "basic", "intermediate", "advanced"]

/** `next/image` sizes matching the 1 / 2 / 3-column catalog grid. */
const THUMBNAIL_SIZES = "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"

/**
 * Subject catalog (§3) — the `/subjects` list. Mirrors the house catalog archetype
 * (see `CourseCatalog`): the shared {@link SearchInput} + difficulty filter + a grid
 * of subject cards linking into each subject workspace. Data is REAL —
 * `useQuerySubjectsSwr` reads `GET /api/v1/subjects`; the feature owns only the
 * client-side filtering, tokens own the look.
 */
export const SubjectCatalog = () => {
    const t = useTranslations("subjects")
    const { subjects, isLoading, error } = useQuerySubjectsSwr()
    const { majors } = useQueryMajorsSwr()
    const { majorCode: myMajor } = useMyMajor()
    const [query, setQuery] = useState("")
    const [difficulty, setDifficulty] = useState<Subject["difficulty"] | "all">("all")
    // `undefined` = người dùng CHƯA tự chọn trong phiên này ⇒ lấy ngành trên hồ sơ làm mặc định.
    // `"all"` = họ đã bấm "Tất cả ngành" — phải phân biệt được với "chưa chọn", nếu không thì
    // mỗi lần hồ sơ load xong lại nhảy ngược về ngành của họ và nút "Tất cả" trông như hỏng.
    const [majorFilter, setMajorFilter] = useState<string | undefined>(undefined)
    const activeMajor = majorFilter ?? myMajor ?? "all"

    const filtered = subjects.filter((subject) => {
        const matchesDifficulty = difficulty === "all" || subject.difficulty === difficulty
        // Lọc ngành ở CLIENT trên `majorCodes` (cùng lý do với bộ lọc độ khó: danh mục môn nhỏ,
        // đã tải sẵn size=100). Môn chưa gắn ngành nào chỉ hiện ở "Tất cả ngành" — không đoán bừa.
        const matchesMajor = activeMajor === "all" || subject.majorCodes.includes(activeMajor)
        const matchesQuery =
            query.trim() === "" ||
            `${subject.code} ${subject.name}`.toLowerCase().includes(query.trim().toLowerCase())
        return matchesDifficulty && matchesMajor && matchesQuery
    })

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

            {/* search + difficulty filter — static chrome, stays outside the skeleton */}
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
                {/* bộ lọc NGÀNH — chỉ hiện khi danh mục có dữ liệu (BE chưa deploy V336 hoặc
                    danh mục rỗng ⇒ ẩn hẳn hàng này thay vì hiện một hàng chỉ có "Tất cả"). */}
                {majors.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                        <Button
                            size="sm"
                            variant={activeMajor === "all" ? "secondary" : "ghost"}
                            onPress={() => setMajorFilter("all")}
                        >
                            {t("catalog.allMajors")}
                        </Button>
                        {majors.map((major) => (
                            <Button
                                key={major.code}
                                size="sm"
                                variant={activeMajor === major.code ? "secondary" : "ghost"}
                                onPress={() => setMajorFilter(major.code)}
                            >
                                {major.name}
                            </Button>
                        ))}
                    </div>
                ) : null}
                <div className="flex flex-wrap gap-2">
                    {DIFFICULTIES.map((option) => (
                        <Button
                            key={option}
                            size="sm"
                            variant={difficulty === option ? "secondary" : "ghost"}
                            onPress={() => setDifficulty(option)}
                        >
                            {option === "all" ? t("catalog.all") : t(`difficulty.${option}`)}
                        </Button>
                    ))}
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
                {filtered.length === 0 ? (
                    <Typography type="body-sm" color="muted">
                        {/* Ngành có thật nhưng chưa môn nào (vd Vi Mạch / Toán Học trên dữ liệu
                            hiện tại) là trạng thái HỢP LỆ — nói đúng thế thay vì "không khớp
                            tìm kiếm", để người dùng không tưởng mình gõ sai. */}
                        {activeMajor !== "all" && query.trim() === "" && difficulty === "all"
                            ? t("catalog.emptyMajor")
                            : t("catalog.empty")}
                    </Typography>
                ) : (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {filtered.map((subject) => (
                            <SubjectCard key={subject.id} subject={subject} />
                        ))}
                    </div>
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

                {/* hàng meta — [chip độ khó] · tín chỉ · kỳ. Chip tự giữ bờ (không có middot
                    ngay sau nó); middot chỉ chèn giữa hai đoạn chữ thường. */}
                <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-muted">
                    <Chip size="sm" variant="soft" color="accent">
                        {t(`difficulty.${subject.difficulty}`)}
                    </Chip>
                    <span>{t("credits", { count: subject.credits })}</span>
                    {/* Kỳ khuyến nghị chỉ hiện khi môn có gắn kỳ — null thì ẩn, không đoán. */}
                    {subject.recommendedSemester !== null ? (
                        <>
                            <span aria-hidden>·</span>
                            <span>{t("semester", { count: subject.recommendedSemester })}</span>
                        </>
                    ) : null}
                </div>

                {/* mô tả ngắn — 2 dòng, chỉ khi BE có trả. Đây là phần thẻ môn thiếu so với
                    thẻ khoá: trước đó dưới ảnh chỉ có mã/tên/chip nên trống một mảng. */}
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
 * hàng chip, hai dòng mô tả — cùng hộp, cùng tỉ lệ, cùng radius.
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
                <Skeleton.Chip />
                <Skeleton.Typography type="body-xs" width="1/4" />
            </div>
            <Skeleton.Typography type="body-xs" width="full" />
            <Skeleton.Typography type="body-xs" width="2/3" />
        </div>
    </div>
)
