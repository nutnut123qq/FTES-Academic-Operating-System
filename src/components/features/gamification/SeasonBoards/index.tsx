"use client"

import React, { useState } from "react"
import { Button, Skeleton, Tabs, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { BuildingsIcon, InfoIcon, TrophyIcon } from "@phosphor-icons/react"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { ExtendedTabs } from "@/components/blocks/navigation/ExtendedTabs"
import { useQueryMyCoursesSwr } from "@/components/features/course/hooks/useQueryMyCoursesSwr"
import { useAppSelector } from "@/redux/hooks"
import type { SeasonBoardKey } from "@/modules/api/rest/gamification"
import { useQuerySeasonBoardSwr } from "../hooks/useQuerySeasonBoardSwr"
import { CourseBoardPicker } from "./CourseBoardPicker"
import { SeasonBoardList } from "./SeasonBoardList"
import { SeasonHeader } from "./SeasonHeader"
import { SEASON_BOARDS } from "./model"
import { useBoardFailureContent } from "./useBoardFailureContent"

/** Icon từng bảng — nói ngay lát cắt EXP mà bảng đó đếm. */
const BOARD_ICON: Record<SeasonBoardKey, typeof TrophyIcon> = {
    total: TrophyIcon,
    social: BuildingsIcon,
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
 * Hai bảng xếp hạng theo kỳ — bề mặt chính của `/leaderboard`.
 *
 * HAI BẢNG KHÁC NHAU Ở CHỖ ĐẾM LÁT CẮT EXP NÀO, không phải khác đơn vị (EXP là một đơn
 * vị duy nhất, không quy đổi, không hệ số):
 *   1. Tổng   — mọi dòng sổ cái EXP trong kỳ; bảng đua giải có phần thưởng thật.
 *   2. Cộng đồng & Workplace — hai mảng riêng, rank chung một bảng.
 *
 * ★ BẢNG KHOÁ HỌC KHÔNG Ở ĐÂY. Nó đã có sẵn ở `/courses/{slug}/learn/leaderboard`
 * (GraphQL `courseLeaderboard`, công thức riêng: điểm challenge + bài đã đọc + % hoàn
 * thành), và backend TỪ CHỐI phục vụ `board=course` có chủ đích. Dựng bản thứ hai ở đây
 * sẽ cho ra hai con số cùng tên "hạng trong khoá" mà không con nào giải thích được con
 * kia — nên chỗ này chỉ là LỐI VÀO bảng đã có, không phải một bảng mới.
 *
 * ★ BỐN KẾT CỤC, BỐN CÂU NÓI. Lỗi tải · chưa khai kỳ nào (`NO_SEASON`, cờ backend cấp
 * riêng cho việc này) · kỳ đang chạy nhưng chưa ai lên bảng · có dữ liệu. Gộp bất kỳ hai
 * cái nào là nói với người dùng một điều không đúng.
 */
export const SeasonBoards = () => {
    const t = useTranslations("gamification.seasonBoards")
    const failureContent = useBoardFailureContent()
    const viewer = useAppSelector((state) => state.user.user)

    const [board, setBoard] = useState<SeasonBoardKey>("total")
    const { courses } = useQueryMyCoursesSwr()

    const {
        rows,
        myRank,
        seasonCode,
        outcome,
        isGuest,
        isLoading,
        isValidating,
        error,
        mutate,
    } = useQuerySeasonBoardSwr({ board })

    const endpoint = `GET /gamification/boards/${board}`
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

            <SeasonHeader seasonCode={seasonCode} noSeason={outcome === "NO_SEASON"} />

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

            {/* Lối vào bảng KHOÁ HỌC đã có — KHÔNG dựng lại bảng đó ở đây. */}
            <CourseBoardPicker courses={courses} />

            {/* Thanh công cụ: hạng của mình + làm mới.
                "Bạn chưa có hạng" CHỈ được nói khi bảng đã tải xong, có kỳ, và thật sự
                không có hạng — nói câu đó lúc đang tải, đang lỗi, hay chưa khai kỳ nào là
                biến mấy tình huống khác nhau thành cùng một lời khẳng định sai. */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <Typography type="body-sm" weight="medium">
                    {isGuest || isLoading || outcome === "FAILED" || outcome === "NO_SEASON"
                        ? " "
                        : myRank !== null
                            ? t("myRank", { rank: myRank })
                            : t("myRankUnranked")}
                </Typography>
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

            {isGuest ? (
                // Endpoint đòi đăng nhập. Đây KHÔNG phải lỗi và cũng KHÔNG phải bảng rỗng —
                // nói đúng việc phải làm thay vì hiện một khối 401.
                <Typography type="body-sm" color="muted">
                    {t("guest")}
                </Typography>
            ) : outcome === "NO_SEASON" ? (
                // Cờ NO_SEASON của backend: KHÔNG có kỳ nào đang chạy. Câu này phải khác
                // hẳn câu "chưa ai lên bảng" ở nhánh rỗng bên dưới — `SeasonHeader` đã nói
                // rõ, nên chỗ này im lặng chứ không vẽ thêm một màn rỗng nói sai.
                null
            ) : (
                <AsyncContent
                    isLoading={isLoading && rows.length === 0}
                    skeleton={<BoardSkeleton />}
                    isEmpty={rows.length === 0}
                    emptyContent={{ title: t("empty"), description: t("emptyHint") }}
                    // ★ Lỗi ĐI TRƯỚC rỗng: lỗi tải phải hiện ra thành câu chữ, không được
                    // rơi vào nhánh "chưa có ai lên bảng".
                    error={boardFailure ? error : undefined}
                    errorContent={boardFailure ?? undefined}
                >
                    <SeasonBoardList
                        rows={rows}
                        viewerName={viewer?.displayName ?? viewer?.username ?? null}
                        viewerAvatar={viewer?.avatar ?? null}
                    />
                </AsyncContent>
            )}
        </section>
    )
}
