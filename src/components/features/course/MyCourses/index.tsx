"use client"

import React, { useMemo, useState } from "react"
import { Button, Chip, Typography } from "@heroui/react"
import { useFormatter, useLocale, useTranslations } from "next-intl"
import { useRouter } from "@/i18n/navigation"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { EmptyContent } from "@/components/blocks/async/EmptyContent"
import { ContinueCourseCard } from "@/components/features/course/ContinueCourseCard"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { FtesMascot } from "@/components/reuseable/FtesMascot"
import { MascotProfileNudge } from "@/components/features/mascot-moments"
import { TermFilterDropdown, type TermFilterOption } from "../TermFilterDropdown"
import { useQueryMyCoursesSwr, type MyCourse } from "../hooks/useQueryMyCoursesSwr"
import { localizeTermName } from "@/utils/term-name"

/**
 * Khoá của nhóm "Ngoài kỳ học" (`termId === null`). Là một giá trị CHỌN được chứ không
 * phải một trạng thái ẩn: khoá vĩnh viễn (không thuộc kỳ nào) là chuyện thường, mà
 * `null` thì không dùng làm khoá chọn được. Ở mục mặc định "Tất cả kỳ" nhóm này vẫn hiện.
 */
const NO_TERM = "__no_term__"

/**
 * "Khóa học của tôi" (`/courses/me`) — the signed-in viewer's active enrollments as
 * a grid of resumable {@link ContinueCourseCard}s (cover · title · % complete ·
 * progress bar · "Tiếp tục học"), each linking into the course learn shell
 * (least-finished first). TWO cards per row on desktop and one below `lg`, because the
 * card is a horizontal row whose title only gets whatever the fixed cover and CTA leave
 * behind — see the grid comment below.
 * Loading gates progress-card-shaped skeletons; an empty enrollment set shows an
 * onboarding empty state with a link to the catalog. Owns its container gutter,
 * mirroring {@link CourseCatalog}.
 *
 * Bộ lọc kỳ ở đây lọc phía CLIENT và danh sách kỳ dựng từ chính `courses` — KHÔNG gọi
 * `listTerms()`. Hai lý do: dữ liệu kỳ đã nằm sẵn trên từng dòng enrollment (`termId`/
 * `termName`), và người học chỉ nên thấy những kỳ mình THẬT SỰ có khoá chứ không phải cả
 * danh mục kỳ của trường. Bộ lọc chỉ ảnh hưởng lưới thẻ: các nhánh loading / error /
 * empty của {@link AsyncContent} vẫn đọc `courses` (số enrollment THẬT), nên lọc ra 0
 * khoá không bị nhầm thành "chưa đăng ký khoá nào" và ô lọc không tự biến mất.
 */
export const MyCourses = () => {
    const t = useTranslations()
    const format = useFormatter()
    const locale = useLocale()
    const router = useRouter()
    const { courses, isLoading, error, mutate } = useQueryMyCoursesSwr()
    // `undefined` = "Tất cả kỳ" (mặc định)
    const [termFilter, setTermFilter] = useState<string | undefined>(undefined)

    /**
     * Các nhóm kỳ dựng từ chính danh sách khoá, distinct theo `termId`, giữ nguyên thứ tự
     * xuất hiện (hook đã sắp ít-hoàn-thành-nhất lên đầu). Kỳ đã bị xoá (`termId` còn
     * nhưng `termName === null`) vẫn là một nhóm chọn được với nhãn dự phòng — không
     * render chuỗi rỗng, và không dòng nào văng khỏi mọi lựa chọn.
     */
    const termOptions = useMemo((): Array<TermFilterOption> => {
        const options: Array<TermFilterOption> = []
        const seen = new Set<string>()
        let hasNoTerm = false
        for (const course of courses) {
            if (course.termId === null) {
                hasNoTerm = true
                continue
            }
            if (seen.has(course.termId)) continue
            seen.add(course.termId)
            options.push({
                id: course.termId,
                label: localizeTermName(locale, course.termName) ?? t("courses.mine.termUnknown"),
            })
        }
        // "Ngoài kỳ học" đứng CUỐI có chủ đích: nó không phải một kỳ, xếp lẫn vào giữa
        // sẽ đọc thành "có một kỳ tên là Ngoài kỳ học".
        if (hasNoTerm) {
            options.push({ id: NO_TERM, label: t("courses.mine.termNone") })
        }
        return options
    }, [courses, locale, t])

    // một lựa chọn duy nhất thì không phải bộ lọc → không render
    const showTermFilter = termOptions.length > 1
    const visibleCourses = showTermFilter && termFilter !== undefined
        ? courses.filter((course) => (
            termFilter === NO_TERM ? course.termId === null : course.termId === termFilter
        ))
        : courses

    /** Term-status chip for a card: "term ended" (expired) or "open until {date}". */
    const termBadge = (course: MyCourse): React.ReactNode => {
        if (course.expired) {
            return (
                <Chip size="sm" variant="soft" color="danger">
                    {t("courses.termExpired")}
                </Chip>
            )
        }
        if (course.accessUntil) {
            return (
                <Chip size="sm" variant="soft" color="warning">
                    {t("courses.termUntil", {
                        date: format.dateTime(new Date(course.accessUntil), { dateStyle: "medium" }),
                    })}
                </Chip>
            )
        }
        return null
    }

    return (
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
            <div className="flex flex-col gap-1">
                <Typography type="h4" weight="bold">
                    {t("courses.mine.title")}
                </Typography>
                <Typography type="body-sm" color="muted">
                    {t("courses.mine.subtitle")}
                </Typography>
            </div>

            {/* loading gates progress-card skeletons; empty → onboarding; error → retry */}
            <AsyncContent
                isLoading={isLoading}
                skeleton={(
                    /* same column count as the real grid (see below) so the layout does
                       not re-flow the moment the enrollments land */
                    <div className="grid gap-3 lg:grid-cols-2">
                        {[0, 1, 2, 3].map((i) => (
                            <Skeleton key={i} className="h-64 w-full rounded-large" />
                        ))}
                    </div>
                )}
                error={courses.length === 0 ? error : undefined}
                errorContent={{
                    title: t("courses.loadError"),
                    onRetry: () => { void mutate() },
                    retryLabel: t("courses.retry"),
                }}
                isEmpty={courses.length === 0}
                emptyContent={{
                    icon: <FtesMascot pose="explain" size="lg" />,
                    title: t("courses.mine.empty"),
                    description: t("courses.mine.emptyHint"),
                    action: (
                        <Button variant="primary" onPress={() => router.push("/courses")}>
                            {t("courses.mine.browse")}
                        </Button>
                    ),
                }}
            >
                <div className="flex flex-col gap-4">
                    {/* profile-completion nudge sits above the list ONLY when there are
                        courses (no empty-state mascot), keeping one mascot per page */}
                    <MascotProfileNudge />
                    {/* bọc trong một flex row: `Dropdown.Trigger` là <button>, thả thẳng vào
                        cột `flex flex-col` thì nó stretch hết chiều ngang trang */}
                    {showTermFilter ? (
                        <div className="flex">
                            <TermFilterDropdown
                                options={termOptions}
                                value={termFilter}
                                onChange={setTermFilter}
                                label={t("courses.mine.termLabel")}
                                allLabel={t("courses.mine.termAll")}
                            />
                        </div>
                    ) : null}
                    {/* TWO per row on desktop, one below `lg` — NOT three.
                        `ContinueCourseCard` is a horizontal row (128/160px cover + the
                        "Tiếp tục học" CTA, both `shrink-0`) and only the middle text
                        column flexes, so the column count sets the title's width directly:
                        at three across this `max-w-6xl` page the text column collapsed to
                        ~70px and `line-clamp-2` clipped every title to a single character
                        ("M", "S", "H"). Two across leaves it ~175px+, which fits the
                        two-line clamp. `sm:grid-cols-2` is gone for the same reason — a
                        640px viewport split in two squeezed the title just as hard. */}
                    {/* lọc ra 0 khoá KHÁC hẳn "chưa đăng ký khoá nào" — dùng lại copy kia
                        là nói sai. Trạng thái này nằm TRONG children nên ô lọc vẫn hiện
                        phía trên, người dùng gỡ lọc được ngay. Icon mặc định (khay), không
                        mascot: trang đã có một mascot ở chỗ khác. */}
                    {visibleCourses.length === 0 ? (
                        <EmptyContent
                            title={t("courses.mine.filterEmpty")}
                            description={t("courses.mine.filterEmptyHint")}
                            action={(
                                <Button variant="secondary" onPress={() => setTermFilter(undefined)}>
                                    {t("courses.mine.termAll")}
                                </Button>
                            )}
                        />
                    ) : null}
                    <div className="grid gap-3 lg:grid-cols-2">
                        {visibleCourses.map((course) => (
                            <ContinueCourseCard
                                key={course.courseId}
                                href={course.href}
                                coverUrl={course.coverImage}
                                title={course.title}
                                completionPercent={course.completionPercent}
                                badge={termBadge(course)}
                                expired={course.expired}
                            />
                        ))}
                    </div>
                </div>
            </AsyncContent>
        </div>
    )
}
