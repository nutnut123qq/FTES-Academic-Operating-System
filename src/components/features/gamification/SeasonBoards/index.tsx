"use client"

import React, { useState } from "react"
import { Button, Skeleton, Tabs, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { BuildingsIcon, InfoIcon, TrophyIcon, GraduationCapIcon} from "@phosphor-icons/react"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { ExtendedTabs } from "@/components/blocks/navigation/ExtendedTabs"
import { useQueryMyCoursesSwr } from "@/components/features/course/hooks/useQueryMyCoursesSwr"
import { useAppSelector } from "@/redux/hooks"
import type { SeasonBoardKey } from "@/modules/api/rest/gamification"
import { useQuerySeasonBoardSwr } from "../hooks/useQuerySeasonBoardSwr"
import { CourseBoardPicker } from "./CourseBoardPicker"
import { SeasonBoardList } from "./SeasonBoardList"
import { SeasonHeader } from "./SeasonHeader"
import { SEASON_SCOPES, type SeasonScope } from "./model"
import { SeasonPicker } from "./SeasonPicker"
import { useQuerySeasonOptionsSwr } from "../hooks/useQuerySeasonOptionsSwr"
import { useBoardFailureContent } from "./useBoardFailureContent"

/** Icon từng lát cắt — nói ngay bảng đó đếm EXP từ đâu. */
const BOARD_ICON: Record<SeasonScope, typeof TrophyIcon> = {
    total: TrophyIcon,
    course: GraduationCapIcon,
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

    // HAI trục điều khiển, và chỉ hai: LÁT CẮT (bảng nào) và CỬA SỔ (kỳ nào / tích luỹ).
    // "Khoá học" là một lát cắt thứ ba nhưng KHÔNG phải một bảng của endpoint này — nó có
    // công thức riêng ở GraphQL `courseLeaderboard`. Gộp nó vào cùng thanh chọn là đúng
    // với cách người dùng nghĩ ("xem bảng nào"), nên trạng thái ở đây là `scope` chứ không
    // phải `board`, và chỉ hai giá trị đầu mới ánh xạ sang một lần gọi bảng.
    const [scope, setScope] = useState<SeasonScope>("total")
    const [season, setSeason] = useState<string | null>(null)
    const { courses } = useQueryMyCoursesSwr()
    const { seasons } = useQuerySeasonOptionsSwr()

    const board: SeasonBoardKey = scope === "social" ? "social" : "total"
    const isCourseScope = scope === "course"

    const {
        rows,
        myRank,
        myXp,
        seasonCode,
        seasonName,
        endsAt,
        lifetime,
        outcome,
        isGuest,
        isLoading,
        isValidating,
        error,
        mutate,
    } = useQuerySeasonBoardSwr({ board, season, enabled: !isCourseScope })

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

            {/* Dải mùa giải ĐỨNG TRƯỚC hai nút: câu hỏi đầu tiên của người mở trang là "mình
                đang đứng đâu, kỳ này còn bao lâu", không phải "đổi sang bảng nào". Đặt nút lên
                trước là bắt người ta lướt qua một hàng điều khiển mới tới được câu trả lời.
                Lát cắt khoá học không đi qua endpoint này nên không có kỳ để hiện — vẽ dải ở đó
                là hiện số của bảng KHÁC ngay trên bảng đang xem. */}
            {isCourseScope ? null : (
                <SeasonHeader
                    seasonCode={seasonCode}
                    seasonName={seasonName}
                    endsAt={endsAt}
                    lifetime={lifetime}
                    noSeason={outcome === "NO_SEASON"}
                    myRank={myRank}
                    myXp={myXp}
                />
            )}

            {/* HAI nút điều khiển, hết. Trước đợt này trang có mười hai: ba nút kỳ hạn mục
                tiêu, ba nút chỉ số, ô nhập, nút lưu, hai tab, ô chọn khoá và một link mở
                bảng khoá. Khối mục tiêu đã dọn sang trang hồ sơ (nó là việc riêng của từng
                người, không liên quan đua hạng), còn ô chọn khoá nay chỉ hiện KHI chọn lát
                cắt "khoá học" — nên lúc nào trên màn hình cũng chỉ có đúng hai nút. */}
            <div className="flex flex-wrap items-center gap-2">
                <SeasonPicker
                    seasons={seasons}
                    value={season}
                    onChange={setSeason}
                    currentLabel={seasonName ?? seasonCode}
                />
                <div className="min-w-0 flex-1">
                    <ExtendedTabs
                        selectedKey={scope}
                        onSelectionChange={(key) => setScope(key as SeasonScope)}
                    >
                        <Tabs.ListContainer>
                            <Tabs.List aria-label={t("title")}>
                                {SEASON_SCOPES.map((key) => {
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
                                                {/* Nhãn hiện từ sm trở lên; dưới đó giữ bản
                                                    sr-only để tab icon-only vẫn có tên cho
                                                    trình đọc màn hình. */}
                                                <span className="hidden sm:inline">{label}</span>
                                                <span className="sr-only sm:hidden">{label}</span>
                                            </span>
                                        </Tabs.Tab>
                                    )
                                })}
                            </Tabs.List>
                        </Tabs.ListContainer>
                    </ExtendedTabs>
                </div>
            </div>

            {/* "Bảng này đếm gì" — phần bắt buộc, không phải trang trí. Người hạng 3 bảng
                này mà hạng 40 bảng kia sẽ đọc thành "hệ thống tính sai" nếu không có nó. */}
            <div className="flex flex-col gap-1 rounded-2xl bg-default/40 p-4">
                <div className="flex items-center gap-2">
                    <InfoIcon className="size-4 text-muted" aria-hidden focusable="false" />
                    <Typography type="body-xs" color="muted">
                        {t("countsLabel")}
                    </Typography>
                </div>
                <Typography type="body-sm">{t(`counts.${scope}`)}</Typography>
                <Typography type="body-xs" color="muted">
                    {t("whyDifferent")}
                </Typography>
            </div>

            {isCourseScope ? (
                // Bảng khoá học ĐÃ CÓ ở /courses/{slug}/learn/leaderboard với công thức
                // riêng. Dựng lại bản thứ hai ở đây sẽ đẻ ra hai con số cùng tên "hạng
                // trong khoá" mà không khớp nhau — hỏng nặng hơn hẳn một cú điều hướng.
                <CourseBoardPicker courses={courses} />
            ) : (
                <>
                    <div className="flex flex-wrap items-center justify-end gap-3">
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
                        // Endpoint đòi đăng nhập. Đây KHÔNG phải lỗi và cũng KHÔNG phải bảng
                        // rỗng — nói đúng việc phải làm thay vì hiện một khối 401.
                        <Typography type="body-sm" color="muted">
                            {t("guest")}
                        </Typography>
                    ) : outcome === "NO_SEASON" ? (
                        // Cờ NO_SEASON: KHÔNG có kỳ nào đang chạy. Câu này phải khác hẳn câu
                        // "chưa ai lên bảng" ở nhánh rỗng bên dưới — SeasonHeader đã nói rõ,
                        // nên chỗ này im lặng chứ không vẽ thêm một màn rỗng nói sai.
                        null
                    ) : (
                        <AsyncContent
                            isLoading={isLoading && rows.length === 0}
                            skeleton={<BoardSkeleton />}
                            isEmpty={rows.length === 0}
                            emptyContent={{ title: t("empty"), description: t("emptyHint") }}
                            // ★ Lỗi ĐI TRƯỚC rỗng: lỗi tải phải hiện ra thành câu chữ, không
                            // được rơi vào nhánh "chưa có ai lên bảng".
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
                </>
            )}
        </section>
    )
}
