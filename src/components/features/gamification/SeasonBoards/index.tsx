"use client"

import React, { useEffect, useState } from "react"
import { Button, Skeleton, Tabs, Typography } from "@heroui/react"
import { useLocale, useTranslations } from "next-intl"
import { BuildingsIcon, GraduationCapIcon, InfoIcon, TrophyIcon } from "@phosphor-icons/react"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { ExtendedTabs } from "@/components/blocks/navigation/ExtendedTabs"
import { useQueryMyCoursesSwr } from "@/components/features/course/hooks/useQueryMyCoursesSwr"
import type { SeasonBoardKey } from "@/modules/api/rest/gamification"
import { useQueryCurrentSeasonSwr } from "../hooks/useQueryCurrentSeasonSwr"
import { useQuerySeasonBoardSwr } from "../hooks/useQuerySeasonBoardSwr"
import { CourseBoardPicker } from "./CourseBoardPicker"
import { SeasonBoardList } from "./SeasonBoardList"
import { SeasonHeader } from "./SeasonHeader"
import { SEASON_BOARDS } from "./model"
import { useBoardFailureContent } from "./useBoardFailureContent"

/** Icon từng bảng — nói ngay lát cắt EXP mà bảng đó đếm. */
const BOARD_ICON: Record<SeasonBoardKey, typeof TrophyIcon> = {
    course: GraduationCapIcon,
    community: BuildingsIcon,
    total: TrophyIcon,
}

/** Khung xương khớp với danh sách thật (bục + vài dòng) nên hộp không nhảy khi có dữ liệu. */
const BoardSkeleton = () => (
    <div className="flex flex-col gap-6">
        <div className="flex items-end justify-center gap-4">
            {["h-14", "h-20", "h-10"].map((height, index) => (
                <Skeleton key={index} className={`${height} w-24 rounded-t-xl`} />
            ))}
        </div>
        <div className="flex flex-col gap-2">
            {[0, 1, 2, 3, 4].map((row) => (
                <Skeleton key={row} className="h-12 w-full rounded-2xl" />
            ))}
        </div>
    </div>
)

/**
 * Ba bảng xếp hạng theo kì — bề mặt chính của `/leaderboard`.
 *
 * BA BẢNG KHÁC NHAU Ở CHỖ ĐẾM LÁT CẮT EXP NÀO, không phải khác đơn vị (EXP là một đơn
 * vị duy nhất, không quy đổi, không hệ số):
 *   1. Khoá học   — chỉ EXP kiếm trong CHÍNH khoá đó, xếp hạng nội bộ khoá.
 *   2. Cộng đồng & Workplace — hai nguồn riêng, rank chung một bảng.
 *   3. Tổng       — gom cả ba; đây là bảng đua giải có phần thưởng thật.
 *
 * Mỗi bảng nói thẳng nó ĐẾM GÌ ngay dưới tab: không giải thích thì người xếp hạng 3 ở
 * bảng này mà hạng 40 ở bảng kia sẽ kết luận hệ thống tính sai.
 *
 * ★ TRẠNG THÁI "BE CHƯA CÓ" LÀ LỖI, KHÔNG PHẢI MÀN RỖNG. Hai lane BE của đợt này chưa
 * merge nên `GET /gamification/leaderboards/*` có thể trả 404 — lúc đó bề mặt hiện một
 * câu nói rõ endpoint nào trả mã gì, chứ tuyệt đối không giả vờ "chưa có ai lên bảng".
 */
export const SeasonBoards = () => {
    const t = useTranslations("gamification.seasonBoards")
    const locale = useLocale()
    const failureContent = useBoardFailureContent()

    const [board, setBoard] = useState<SeasonBoardKey>("total")
    const [courseSlug, setCourseSlug] = useState<string | null>(null)

    const season = useQueryCurrentSeasonSwr()
    const { courses, isLoading: coursesLoading } = useQueryMyCoursesSwr()

    // Tab khoá học mở ra mà chưa chọn gì thì chọn sẵn khoá đầu (khoá ít hoàn thành
    // nhất — thứ tự của `useQueryMyCoursesSwr`). Chỉ tự chọn MỘT LẦN: ghi đè lựa chọn
    // của người dùng mỗi lần danh sách khoá revalidate là cướp quyền điều khiển.
    useEffect(() => {
        if (courseSlug === null && courses.length > 0) {
            setCourseSlug(courses[0].slug)
        }
    }, [courseSlug, courses])

    const {
        rows,
        myRank,
        computedAt,
        awaitingCourse,
        isLoading,
        isValidating,
        error,
        mutate,
    } = useQuerySeasonBoardSwr({
        board,
        seasonId: season.season?.seasonId ?? null,
        courseId: board === "course" ? courseSlug : null,
    })

    const endpoint = `GET /gamification/leaderboards/${board}`
    const boardFailure = failureContent(error, endpoint, () => void mutate())

    return (
        <section className="flex flex-col gap-4">
            <div className="flex flex-col gap-0">
                <Typography type="h5" weight="bold">
                    {t("title")}
                </Typography>
                <Typography type="body-sm" color="muted">
                    {t("subtitle")}
                </Typography>
            </div>

            <SeasonHeader
                season={season.season}
                isLoading={season.isLoading}
                error={season.error}
                onRetry={() => void season.mutate()}
            />

            <ExtendedTabs
                selectedKey={board}
                onSelectionChange={(key) => setBoard(key as SeasonBoardKey)}
            >
                <Tabs.ListContainer>
                    <Tabs.List aria-label={t("title")}>
                        {SEASON_BOARDS.map((key) => {
                            const BoardIcon = BOARD_ICON[key]
                            const label = t(`tabs.${key}`)
                            return (
                                <Tabs.Tab key={key} id={key}>
                                    <span className="flex items-center gap-2">
                                        <BoardIcon
                                            aria-hidden
                                            focusable="false"
                                            className="size-5 shrink-0"
                                        />
                                        {/* Nhãn hiện từ sm trở lên; dưới đó giữ bản sr-only
                                            để tab icon-only vẫn có tên cho trình đọc màn hình. */}
                                        <span className="hidden sm:inline">{label}</span>
                                        <span className="sr-only sm:hidden">{label}</span>
                                    </span>
                                </Tabs.Tab>
                            )
                        })}
                    </Tabs.List>
                </Tabs.ListContainer>
            </ExtendedTabs>

            {/* "Bảng này đếm gì" — phần bắt buộc, không phải trang trí. */}
            <div className="flex flex-col gap-1 rounded-2xl bg-default/40 p-4">
                <div className="flex items-center gap-2">
                    <InfoIcon className="size-4 text-muted" aria-hidden focusable="false" />
                    <Typography type="body-xs" color="muted">
                        {t("countsLabel")}
                    </Typography>
                </div>
                <Typography type="body-sm">{t(`counts.${board}`)}</Typography>
                <Typography type="body-xs" color="muted">
                    {t("whyDifferent")}
                </Typography>
            </div>

            {board === "course" ? (
                coursesLoading ? (
                    <Skeleton className="h-9 w-56 rounded-full" />
                ) : (
                    <CourseBoardPicker
                        courses={courses}
                        selectedSlug={courseSlug}
                        onSelect={setCourseSlug}
                    />
                )
            ) : null}

            {/* Thanh công cụ: hạng của mình + lúc chốt số + làm mới.
                "Bạn chưa có hạng" CHỈ được nói khi bảng đã tải xong và thật sự không có
                hạng — nói câu đó lúc đang tải, đang lỗi, hay chưa chọn khoá là biến ba
                tình huống khác nhau thành cùng một lời khẳng định sai. */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <Typography type="body-sm" weight="medium">
                    {boardFailure || isLoading || awaitingCourse
                        ? " "
                        : myRank
                            ? t("myRank", { rank: myRank.rank })
                            : t("myRankUnranked")}
                </Typography>
                <div className="flex shrink-0 items-center gap-3">
                    {computedAt ? (
                        <Typography type="body-xs" color="muted" className="hidden sm:block">
                            {t("updatedAt", {
                                time: new Date(computedAt).toLocaleTimeString(locale),
                            })}
                        </Typography>
                    ) : null}
                    <Button
                        size="sm"
                        variant="ghost"
                        isPending={isValidating}
                        onPress={() => {
                            void mutate()
                        }}
                    >
                        {t("refresh")}
                    </Button>
                </div>
            </div>

            {/* Bảng khoá học chưa chọn khoá: KHÔNG phải rỗng, cũng KHÔNG phải lỗi —
                bộ chọn ở trên đã nói phải làm gì, nên chỗ này im lặng. */}
            {awaitingCourse ? null : (
                <AsyncContent
                    isLoading={isLoading && rows.length === 0}
                    skeleton={<BoardSkeleton />}
                    isEmpty={rows.length === 0}
                    emptyContent={{ title: t("empty"), description: t("emptyHint") }}
                    // ★ Lỗi ĐI TRƯỚC rỗng: 404 vì lane BE chưa deploy phải hiện ra thành
                    // câu chữ, không được rơi vào nhánh "chưa có ai lên bảng".
                    error={boardFailure ? error : undefined}
                    errorContent={boardFailure ?? undefined}
                >
                    <SeasonBoardList rows={rows} />
                </AsyncContent>
            )}
        </section>
    )
}
