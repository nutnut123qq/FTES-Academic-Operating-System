"use client"

import React, { useState } from "react"
import { Button, Skeleton, Tabs, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { BuildingsIcon, TrophyIcon } from "@phosphor-icons/react"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { ExtendedTabs } from "@/components/blocks/navigation/ExtendedTabs"
import { SectionCard } from "@/components/reuseable/SectionCard"
import { useAppSelector } from "@/redux/hooks"
import type { SeasonBoardKey } from "@/modules/api/rest/gamification"
import { useQuerySeasonBoardSwr } from "../hooks/useQuerySeasonBoardSwr"
import { SeasonBoardList } from "./SeasonBoardList"
import { SeasonHeader } from "./SeasonHeader"
import { ViewerRankCard } from "./ViewerRankCard"
import { SEASON_SCOPES, shortUserLabel, type SeasonScope } from "./model"
import { SeasonPicker } from "./SeasonPicker"
import { useQuerySeasonOptionsSwr } from "../hooks/useQuerySeasonOptionsSwr"
import { useBoardFailureContent } from "./useBoardFailureContent"

/** Icon từng lát cắt — nói ngay bảng đó đếm EXP từ đâu. */
const BOARD_ICON: Record<SeasonScope, typeof TrophyIcon> = {
    total: TrophyIcon,
    social: BuildingsIcon,
}

/**
 * Số dòng vẽ khi CHƯA mở rộng.
 *
 * Trước đợt này tầng vẽ đổ HẾT những gì máy chủ trả (tức 50 dòng) thẳng ra trang — bảng dài
 * bằng cả màn hình và đẩy mọi thứ dưới nó xuống. Cắt ở tầng VẼ chứ không hạ `limit` xuống 10:
 * cùng một lần gọi đã trả sẵn phần còn lại, nên biết được là "còn nữa hay hết rồi" mà không
 * tốn thêm request nào.
 */
const COLLAPSED_ROWS = 10

/** Trần CỨNG của backend (`SeasonBoardService.MAX_LIMIT`) — xin hơn cũng chỉ nhận 100. */
const EXPANDED_LIMIT = 100

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
export const SeasonBoards = ({ rankSummary }: { rankSummary?: React.ReactNode }) => {
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
    // "Xem thêm" là một CÔNG TẮC MỘT CHIỀU trong phiên: mở rộng rồi thì đổi tab / đổi kỳ vẫn
    // giữ top 100. Bắt người dùng bấm lại sau mỗi lần đổi lát cắt là bắt họ nói lại một câu
    // họ vừa nói xong.
    const [expanded, setExpanded] = useState(false)
    const { seasons } = useQuerySeasonOptionsSwr()

    const board: SeasonBoardKey = scope

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
        viewerUserId,
        isLoading,
        isValidating,
        error,
        mutate,
    } = useQuerySeasonBoardSwr({ board, season, limit: expanded ? EXPANDED_LIMIT : undefined })

    // Cắt ở tầng VẼ. `rows.length > COLLAPSED_ROWS` cũng chính là câu trả lời cho "còn ai
    // nữa không": lần gọi thu gọn đã xin 50 dòng, nên trả về ≤ 10 nghĩa là bảng CHỈ có
    // ngần ấy người — nút "Xem thêm" không được hiện để rồi bấm xong không đổi gì.
    const visibleRows = expanded ? rows : rows.slice(0, COLLAPSED_ROWS)
    const canShowMore = !expanded && rows.length > COLLAPSED_ROWS

    // Khung viền của chính người xem chỉ lấy được khi họ CÓ MẶT trong cửa sổ đang tải —
    // ngoài đó thì `null` và avatar vẽ trần, đúng luật "khung là trang trí, không chen vào
    // đường đọc" của {@link AvatarWithFrame}.
    const viewerRow = rows.find((row) => row.isViewer)
    const viewerName = viewer?.displayName
        ?? viewer?.username
        ?? (viewerUserId ? shortUserLabel(viewerUserId) : "")

    const endpoint = `GET /gamification/boards/${board}`
    const boardFailure = failureContent(error, endpoint, () => void mutate())

    return (
        <section className="flex flex-col gap-4">
            {(rankSummary || seasonCode || outcome === "NO_SEASON") ? (
                <SectionCard>
                    <div className="flex flex-col gap-3">
                        {rankSummary}
                        <SeasonHeader
                            seasonCode={seasonCode}
                            seasonName={seasonName}
                            endsAt={endsAt}
                            lifetime={lifetime}
                            noSeason={outcome === "NO_SEASON"}
                            myRank={myRank}
                            myXp={myXp}
                            separated={Boolean(rankSummary)}
                        />
                    </div>
                </SectionCard>
            ) : null}

            {/* HAI nút điều khiển, hết. Trước đợt này trang có mười hai: ba nút kỳ hạn mục
                tiêu, ba nút chỉ số, ô nhập, nút lưu, hai tab, ô chọn khoá và một link mở
                bảng khoá. Khối mục tiêu đã dọn sang trang hồ sơ (việc riêng của từng người,
                không liên quan đua hạng); bảng khoá học về đúng chỗ của nó là BÊN TRONG mỗi
                khoá, nơi đã biết đang nói tới khoá nào mà không cần hỏi thêm. */}
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

            {/* "Bảng này đếm gì" — GIỮ, nhưng một dòng thay vì hộp xám ba dòng. Câu này không
                phải trang trí: người hạng 3 bảng này mà hạng 40 bảng kia sẽ đọc thành "hệ thống
                tính sai" nếu không có nó. Phần giải thích dài đã có sẵn ở trang "Cách tính điểm";
                lặp lại nguyên văn ngay trên bảng là chiếm chỗ của chính cái bảng. */}
            <Typography type="body-xs" color="muted">
                {t(`counts.${scope}`)}
            </Typography>

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
                <>
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
                            rows={visibleRows}
                            viewerName={viewer?.displayName ?? viewer?.username ?? null}
                            viewerAvatar={viewer?.avatar ?? null}
                        />
                    </AsyncContent>

                    {/* Thẻ hồ sơ + nút mở rộng đi CHUNG một dải ghim: cuộn giữa top 100
                        vẫn thấy mình đang ở đâu và vẫn với tới nút. Chỉ dựng khi bảng
                        THẬT SỰ có dữ liệu — trên bảng rỗng/lỗi thì "hạng của bạn" là câu
                        trả lời cho một câu hỏi chưa hỏi được. */}
                    {outcome === "OK" ? (
                        <div className="sticky bottom-0 z-10 flex flex-col gap-2 bg-background/95 pb-2 pt-3 backdrop-blur">
                            <ViewerRankCard
                                name={viewerName}
                                avatar={viewer?.avatar ?? null}
                                seed={viewerUserId ?? ""}
                                frameCode={viewerRow?.avatarFrame ?? null}
                                rank={myRank}
                                xp={myXp}
                            />
                            {canShowMore ? (
                                // KHÔNG `isPending={isValidating}` ở đây: `setExpanded(true)`
                                // làm `canShowMore` thành false ngay trong cùng lần render, nên
                                // nút bị gỡ khỏi cây trước khi `isValidating` kịp bật — trạng
                                // thái pending của nó không bao giờ vẽ được. Ngược lại, `isValidating`
                                // dùng CHUNG với nút "Làm mới", nên bấm Làm mới lại làm nút này
                                // quay spinner như thể nó đang nạp thêm dòng. Một prop chỉ sáng
                                // lúc sai còn tệ hơn không có.
                                <Button variant="ghost" onPress={() => setExpanded(true)}>
                                    {t("showMore", { limit: EXPANDED_LIMIT })}
                                </Button>
                            ) : null}
                        </div>
                    ) : null}
                </>
            )}
        </section>
    )
}
