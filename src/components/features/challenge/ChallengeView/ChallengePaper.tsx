"use client"

import React, { useCallback, useMemo, useState } from "react"
import { Button, Chip, Typography, cn } from "@heroui/react"
import {
    ArrowSquareOutIcon,
    DownloadSimpleIcon,
    FileXIcon,
    FileZipIcon,
    LockSimpleIcon,
    PaperclipIcon,
    UploadSimpleIcon,
} from "@phosphor-icons/react"
import { useLocale, useTranslations } from "next-intl"

import {
    ExamImageViewer,
    type ExamImageViewerImage,
} from "@/components/features/subject/ExamImageViewer"
import {
    useExamExpand,
    type ExamExpandControls,
} from "@/components/features/subject/ExamImageViewer/useExamExpand"
import {
    ALBUM_INITIAL_LOAD,
    nextAlbumLoadCount,
} from "@/components/features/subject/SubjectFeAlbum/albumLoadWindow"
import { UserLink } from "@/components/features/identity"
import { formatFileSize } from "@/components/features/resource/ResourceUpload/uploadRules"
import { formatRelativeTime } from "@/components/features/community/hooks/relativeTime"
import type {
    ChallengeAuthorView,
    ChallengePaperFileView,
} from "@/modules/api/rest/challenges/types"
import { ChallengePaperCommentThread } from "./ChallengePaperCommentThread"
import { groupChallengePaperFiles, type ChallengePaperSection } from "./paperFileSet"
import { classifyChallengePaper } from "./paperKind"

/**
 * Is handing a paper answer in for AI grading OPEN?
 *
 * **The single switch this whole right column is built around.** Grading a Practical Exam
 * paper with AI is a product that has not been sold yet, so the block ships fully laid out
 * and inert: dropzone, primary action, the lot — all disabled, with
 * `challenge.paper.gradingLocked` saying why. When the paywall lands, the reader-facing
 * work is one flag, not one layout.
 *
 * Deliberately a module constant and not a prop: nothing in `ChallengeView.paperUrl` /
 * `paperMime` (the only two paper facts the BE ships) says anything about entitlement, so
 * a prop today could only be fed a hard-coded `false` from the caller — the same lie, one
 * level further from where it is read. The moment the BE grows the fact — a
 * `ChallengeView.paperGradingEnabled` flag, or a per-viewer entitlement — this constant
 * becomes that field: replace it with a prop, thread the BE value in, and every branch
 * below already does the right thing.
 *
 * Typed `boolean` rather than left to infer `false` so the gated branches stay live code
 * that the compiler keeps checking instead of narrowing away.
 */
export const IS_PAPER_GRADING_OPEN: boolean = false

/** Props for {@link ChallengePaper}. */
export interface ChallengePaperProps {
    /** Direct URL of the paper file (BE `ChallengeView.paperUrl`). */
    paperUrl: string | null
    /** MIME of the paper (BE `ChallengeView.paperMime`); `null` when unknown. */
    paperMime: string | null
    /**
     * The WHOLE paper — every attached file in the author's order (BE
     * `ChallengeView.paperFiles`, contract `challenge-paper-multifile`), each carrying the
     * `role` the SERVER derived from its MIME: `"VIEW"` (an exam page to read in place) or
     * download-only (a template to fill in).
     *
     * Absent / empty — an older BE, or the list/mutation paths that deliberately omit the
     * set — means the surface renders EXACTLY as it always has from {@link paperUrl} +
     * {@link paperMime} alone. Non-empty means those two fields still describe the PRIMARY
     * file of this same set, so nothing about them changes either; they simply stop being
     * the only thing shown.
     */
    paperFiles?: Array<ChallengePaperFileView> | null
    /** Challenge title — used as the accessible name of the picture / embedded viewer. */
    title: string
    /**
     * The challenge's real UUID (BE `ChallengeView.id`) — NOT the routing slug, because
     * the comment endpoints bind a `UUID` path variable. Omitted / empty → the discussion
     * thread is not mounted at all (nothing to key it off), and the column is the uploader
     * plus the hand-in block alone.
     */
    challengeId?: string
    /**
     * Who UPLOADED the paper (BE `ChallengeView.author`). `null` / omitted — no
     * `created_by`, no profile for that user, or a BE older than the contract — hides the
     * uploader block entirely rather than printing a placeholder identity.
     */
    author?: ChallengeAuthorView | null
    /**
     * WHEN the paper was put up (ISO-8601), shown under the uploader as a relative time
     * ("20 giờ trước") — the same pairing the FE album prints over `FeImage.createdAt`.
     *
     * `null` / omitted → the line is dropped and the uploader stands alone. That is the
     * state on EVERY deployment today, because `ChallengeViews.ChallengeView` exposes no
     * creation instant; nothing is substituted for it (`startsAt` is the challenge's OPEN
     * time and a client clock would be invented data), so the surface stays silent about
     * a fact the server has not told it.
     */
    createdAt?: string | null
    /**
     * Rendered inside a DIALOG rather than on a page. Bố cục hai pane giữ NGUYÊN; thứ duy
     * nhất đổi là khung đề lấy chiều cao TỪ ĐÂU: trên trang nó đo theo viewport
     * (`lg:h-[calc(100dvh-12rem)]`), trong dialog nó `lg:flex-1` vào chiều cao mà dialog
     * đã tự ghim (`h-[92vh]`) — đúng cách `SubjectFeAlbum` nhận chiều cao từ dialog FE.
     *
     * Trước đây `inModal` gỡ HẲN mọi ràng buộc chiều cao và để cả dialog cuộn như một
     * khối. Hệ quả là khung xem đề mắc kẹt ở sàn `60dvh` — người đọc mở popup lên chính
     * là để nhìn đề, mà đề lại là thứ nhỏ nhất trong popup. Giờ dialog cho chiều cao,
     * khung đề ăn hết phần thừa, còn cột phải cuộn trong chính nó y như trên trang.
     *
     * Below `lg` the panes still stack naturally. From `lg` up, the paper stays left and
     * the hand-in/uploader/comments column stays right, matching {@link SubjectFeAlbum}.
     */
    inModal?: boolean
    /**
     * Cụm tiêu đề của đề (mã đề · chip · mô tả) khi chủ gọi muốn nó nằm ở ĐẦU CỘT PHẢI,
     * ngay trên "Tệp đính kèm", thay vì chiếm cả dải ngang phía trên khung đề.
     *
     * Chỉ popup truyền (xem `ChallengeView`); trên trang là `undefined` và cột phải giữ
     * nguyên như cũ. Nhận `ReactNode` chứ không tự dựng: cụm ấy thuộc về `ChallengeView`
     * (nó mới biết type/status/tag), component này chỉ cho nó CHỖ ĐỨNG.
     */
    heading?: React.ReactNode
}

/**
 * The EXAM PAPER of a challenge, read side by side with the hand-in block.
 *
 * This is what folding Practical Exams into the challenge bank means on screen: a `pe`-
 * tagged challenge carries the paper file, the learner reads it on the LEFT and hands an
 * answer in on the RIGHT — the two-pane shape of the FE album
 * (`SubjectFeAlbum`): `lg:grid-cols-[minmax(0,1fr)_400px]`, the paper letterboxed on
 * black, the right pane on `bg-overlay`; below `lg` the panes stack with the paper first,
 * because the paper is what the reader came for. A dialog keeps those same responsive
 * columns but drops the viewport-derived height and nested scroll caps.
 *
 * **The hand-in block exists but is GATED** — see {@link IS_PAPER_GRADING_OPEN}. AI
 * grading for papers is sold later, so the block renders in full and does nothing: no file
 * input is mounted, no grading endpoint is called, the action is `isDisabled` and the
 * reason is stated in words. (It previously wasn't rendered at all, and this docstring
 * said the component must never grow a submission form; that was the wrong shape to leave
 * behind — a surface that has to be re-laid-out on the day it is unlocked is a surface
 * that gets re-argued. Flipping one constant is not.)
 *
 * **The right column also says WHO put the paper up and carries the discussion.** Both
 * arrived with the BE contract `challenge-paper-comments`: `ChallengeView.author` (the
 * uploader's resolved profile card) and `/challenges/{id}/comments`. The thread is the
 * house {@link import("@/components/reuseable/PostCommentThread").PostCommentThread},
 * adapted by {@link ChallengePaperCommentThread} exactly the way the FE album adapts it —
 * no likes (the BE ships no reaction table for it), no report (a challenge comment id does
 * not resolve in the community moderation module). The uploader block simply disappears
 * when the BE has no card to give, which is the whole degradation: never a fabricated name.
 *
 * **A paper is a SET of files, not one file.** With `challenge-paper-multifile` the BE
 * ships `paperFiles` — the page images / PDF the candidate READS plus the `.zip`/`.docx`
 * template they DOWNLOAD and fill in — each already marked viewable or download-only
 * SERVER-SIDE from its stored MIME. {@link groupChallengePaperFiles} splits that set:
 * viewable files render inline in the author's order (consecutive pictures collapsing into
 * ONE paged {@link ExamImageViewer} album — the multi-page paper the single-`paperUrl` era
 * could only ask for), and download-only files collect in the right column as "Tệp đính
 * kèm" with their name, size and a download link. The BE's `role` is the ONLY authority on
 * that split; `classifyChallengePaper` is used purely to pick the renderer (picture vs
 * document frame) of a file the server already permitted.
 *
 * When `paperFiles` is absent or empty — an older deployment, or the list path that omits
 * it — every branch below is exactly what it was before that contract, driven by
 * `paperUrl` + `paperMime` alone. That fallback is the compatibility guarantee, not a
 * courtesy.
 *
 * The paper itself renders by kind ({@link classifyChallengePaper}):
 * - **IMAGE** → the SHARED {@link ExamImageViewer} — zoom, pan, ←/→, the lot, already
 *   built for photographed exam pages. The challenge contract carries a SINGLE
 *   `paperUrl`, so it is handed a one-image array and the viewer drops its own paging
 *   affordances (carets, `n/total` counter) on its own. No `loadedCount`: a one-page
 *   window is the whole album.
 * - **PDF** → embedded in an `<iframe>` (the browser's own viewer, so it scrolls and
 *   zooms), plus the same "open in a new tab" escape hatch above it.
 * - **ARCHIVE** → its own state, not the failure state: an archive is a legitimate paper
 *   here (an author zips a whole folder of source and documents), so it reads as
 *   "download the pack". It is also the only kind carrying NO watermark — archives cannot
 *   be stamped.
 * - **anything else** (DOC/DOCX…) → says plainly that it cannot be shown inline and offers
 *   the link. No fake render.
 * - **MISSING** → renders nothing; the caller falls back to the ordinary solve surface.
 *
 * @param props - {@link ChallengePaperProps}
 */
export const ChallengePaper = ({
    paperUrl,
    paperMime,
    paperFiles,
    title,
    challengeId,
    author,
    createdAt,
    inModal = false,
    heading,
}: ChallengePaperProps) => {
    const t = useTranslations("challenge")
    const kind = classifyChallengePaper(paperUrl, paperMime)
    // Full-screen reading, and the switch that hands the right column's width to the paper.
    // Owned here for the same reason the album owns it: the frame and that column are this
    // component's layout, not the viewer's. In a dialog it is left unwired (see below).
    const expand = useExamExpand()

    /**
     * The paper split into what is read in place and what is downloaded. Both halves are
     * empty when the BE sent no attachment list, which is precisely the signal to fall back
     * to the single-file branches below — see {@link groupChallengePaperFiles}.
     */
    const { sections, attachments } = useMemo(
        () => groupChallengePaperFiles(paperFiles),
        [paperFiles],
    )

    /**
     * The paper in the shape the shared viewer reads. ONE entry, because the challenge
     * contract carries one `paperUrl` — never fabricate a multi-page array here: the
     * viewer would then offer carets and an `n/total` counter for pages that do not exist. A
     * genuinely multi-page challenge paper needs a BE field first (an ordered
     * `ChallengeView.paperPages`, the way `FeAlbumView.images` works).
     *
     * `caption` is the picture's alt text in the viewer, so the paper's own alt copy goes
     * there rather than letting it fall back to the album's "page N" wording.
     */
    const viewerImages = useMemo<Array<ExamImageViewerImage>>(
        () =>
            paperUrl
                ? [
                    {
                        id: paperUrl,
                        imageUrl: paperUrl,
                        caption: t("paper.imageAlt", { title }),
                    },
                ]
                : [],
        [paperUrl, title, t],
    )

    // The viewer is controlled, but a one-page paper can never propose another index.
    const onIndexChange = useCallback(() => undefined, [])

    if (kind === "MISSING" || !paperUrl) {
        return null
    }

    /** "Open the original" — every branch offers it; for UNSUPPORTED it is the only path. */
    const openLink = (
        <a
            href={paperUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-fit items-center gap-2 text-sm text-accent no-underline transition-colors hover:text-foreground"
        >
            <ArrowSquareOutIcon className="size-4" aria-hidden focusable="false" />
            {t("paper.open")}
        </a>
    )

    /**
     * IMAGE and PDF earn the tall pinned frame outright: they are surfaces the reader
     * scrolls and zooms inside, so they want the viewport. Any inline section earns it for
     * the same reason.
     *
     * ponytail: a DISCUSSION earns it too. The old rule pinned the frame on the LEFT pane
     * alone, so an archive / unsupported paper (two lines of copy) fell back to a short
     * card — and the right column, which now carries the whole comment thread, grew down
     * the page instead of scrolling inside the frame: the reader had to scroll a screenful
     * of nothing to reach the comments. With a thread to hold, the pinned height is a
     * full column of comments, never an empty box. A paper with no thread at all
     * (`challengeId` absent) keeps the old short card.
     */
    const isFramed =
        sections.length > 0 || kind === "IMAGE" || kind === "PDF" || Boolean(challengeId)

    return (
        <section
            className={cn(
                "flex flex-col gap-3",
                // Mắt xích giữa: dialog ghim chiều cao → `ChallengeView` `flex-1` vào đó →
                // section này `flex-1` tiếp → khung đề bên dưới mới có cái để `flex-1`.
                // Thiếu một mắt là `lg:flex-1` của khung rơi vào chiều cao AUTO và không
                // cao thêm được chút nào. Chỉ khi CÓ khung (`isFramed`): một đề .zip /
                // không xem được là mấy dòng chữ, kéo giãn nó ra chẳng để làm gì.
                //
                // ★ `min-h-0` PHẢI có tiền tố `lg:`, đúng bằng phạm vi `lg:flex-1` phục vụ.
                // Bỏ tiền tố là bỏ sàn `min-height:auto` ở MỌI cỡ màn: dưới `lg`, cột
                // `min-h-0 flex-1 overflow-y-auto` của `ChallengeView` có chiều cao xác
                // định (92vh của dialog) nên flexbox co `section` này lại — và div khung
                // bên trong có `overflow-hidden` nên sàn tự động của nó cũng là 0, tức nó
                // co theo và CẮT nội dung. Kết quả trên điện thoại: thấy một phần ảnh đề,
                // không thấy khối nộp bài / thảo luận, và không có thanh cuộn nào để tới
                // (mọi item đã co vừa khít nên `scrollHeight === clientHeight`).
                inModal && isFramed && "lg:min-h-0 lg:flex-1",
            )}
        >
            <div className="flex flex-wrap items-center justify-between gap-3">
                <Typography type="body" weight="semibold">
                    {t("paper.title")}
                </Typography>
                {openLink}
            </div>

            <div
                className={
                    // Expanded replaces the frame OUTRIGHT (see useExamExpand) — keeping the
                    // docked `lg:grid-cols-[…_400px]` alongside the expanded `lg:grid-cols-1`
                    // would leave Tailwind to settle the tie by stylesheet order.
                    expand.isExpanded
                        ? expand.frameClassName
                        : cn(
                            "overflow-hidden rounded-2xl border border-separator",
                            // Hai pane cạnh nhau từ `lg` ở CẢ hai bề mặt — `inModal` không bao
                            // giờ được đẩy phần thảo luận xuống dưới đề trên một dialog desktop;
                            // nó chỉ đổi chiều cao lấy từ đâu, và bề rộng của cột phải:
                            // Popup rộng gần trọn màn hình, mà đề PE là ảnh scan A4 DỌC và
                            // `object-contain` nên nó bị chặn bởi CHIỀU CAO, không bởi bề
                            // ngang: ở 1920px, một cột phải cố định 400px để lại ~930px nền
                            // trống trong pane trái. Nên chỗ dư phải trả về cho cột phải theo
                            // TỶ LỆ (`32%`, sàn `25rem`) chứ không bằng một bậc `2xl` cố định
                            // — 30rem chỉ ăn 80px của 930px đó. Chỉ đổi ở nhánh POPUP: trang
                            // `/challenges/[challengeId]` giữ nguyên `_400px`, vì "chỉ đổi khi
                            // inModal" là phạm vi chủ dự án đã chốt.
                            inModal
                                ? "lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(25rem,32%)]"
                                : "lg:grid lg:grid-cols-[minmax(0,1fr)_400px]",
                            // A 0-floored row + `min-h-0` on the pane are what let a PORTRAIT scan
                            // shrink to the frame instead of inflating it: a grid item's automatic
                            // minimum size is its CONTENT, and `overflow-hidden` then clips it.
                            // ponytail: 12rem, not 16 — the frame is what the reader came for, so
                            // it takes nearly the whole viewport once scrolled to; the header
                            // above it scrolls away.
                            isFramed
                                && cn(
                                    "lg:min-h-[30rem] lg:grid-rows-[minmax(0,1fr)]",
                                    // Trong dialog KHÔNG đo theo viewport: dialog chỉ cao
                                    // 92vh và còn máng của nó, nên `100dvh-12rem` sẽ tràn
                                    // rồi bị cắt. Nó `flex-1` vào phần dialog còn lại.
                                    inModal ? "lg:flex-1" : "lg:h-[calc(100dvh-12rem)]",
                                ),
                        )
                }
            >
                {/* LEFT — the paper. A multi-file set owns this pane; with no set (or a set
                    of templates only) the single-file branches below are untouched. */}
                {sections.length > 0 ? (
                    <PaperSections
                        sections={sections}
                        title={title}
                        expand={inModal ? undefined : expand}
                    />
                ) : kind === "IMAGE" ? (
                    <ExamImageViewer
                        images={viewerImages}
                        index={0}
                        onIndexChange={onIndexChange}
                        className={
                            expand.isExpanded
                                ? expand.paneClassName
                                // `min-h-0` chỉ có nghĩa khi pane là grid item của khung
                                // `lg:grid`; dưới `lg` nó chỉ bỏ sàn co để khung cắt mất ảnh.
                                : "h-[60dvh] lg:h-full lg:min-h-0"
                        }
                        isExpanded={expand.isExpanded}
                        // Not in a dialog: it already covers the page, and a `fixed` overlay
                        // inside one resolves against the dialog's box rather than the
                        // viewport. No handler → no button, instead of a broken one.
                        onExpandedChange={inModal ? undefined : expand.setExpanded}
                        areCommentsHidden={expand.areCommentsHidden}
                        onCommentsHiddenChange={inModal ? undefined : expand.setCommentsHidden}
                    />
                ) : kind === "PDF" ? (
                    /* No border/radius of its own: the frame around both panes owns them,
                       and a second ring inside it reads as a box in a box. */
                    <iframe
                        src={paperUrl}
                        title={t("paper.imageAlt", { title })}
                        className="h-[60dvh] w-full bg-default lg:h-full"
                    />
                ) : kind === "ARCHIVE" ? (
                    /* An archive IS a legitimate paper here (a folder of source + documents the
                       author zipped), so this reads as an invitation to download the pack — not
                       as the apologetic "we can't preview this" state below. */
                    <div className="flex flex-col items-center justify-center gap-3 p-6 text-center">
                        <FileZipIcon className="size-8 text-muted" aria-hidden focusable="false" />
                        <Typography type="body-sm" color="muted">
                            {t("paper.archiveHint")}
                        </Typography>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center gap-3 p-6 text-center">
                        <FileXIcon className="size-8 text-muted" aria-hidden focusable="false" />
                        <Typography type="body-sm" color="muted">
                            {t("paper.noPreview")}
                        </Typography>
                    </div>
                )}

                {/* RIGHT — the hand-in block (laid out and switched off), then who put the
                    paper up, then the discussion.
                    ponytail: the column no longer scrolls as ONE piece. It used to, and the
                    composer therefore sat at the bottom of a long scroll — to type you had
                    to scroll past the templates, the dropzone and the uploader every time.
                    Now the paper-side blocks scroll in their own capped strip and the
                    DISCUSSION takes the rest of the column, which is what lets the thread
                    pin its composer to the bottom edge (see PostCommentThread). All of it
                    is `lg:`-only: below that the panes stack and the page scrolls as one. */}
                <div
                    className={cn(
                        "flex min-h-0 flex-col gap-4 bg-overlay p-4 lg:overflow-hidden",
                        // Full screen + "hide the comments": `display:none` drops the column
                        // from the layout AND the a11y tree while the thread keeps its scroll,
                        // its page and any half-typed comment. The width it frees goes to the
                        // paper through the frame's `lg:grid-cols-1` (see useExamExpand).
                        !expand.areCommentsVisible && "hidden",
                    )}
                >
                    {/* Mã đề + chip + mô tả, khi popup gửi xuống: đứng TRÊN "Tệp đính kèm"
                        đúng như chủ dự án chốt — nhưng là con TRỰC TIẾP của cột phải, KHÔNG
                        nằm trong dải bị cap `lg:max-h-[45%]` bên dưới. Nhét nó vào trong dải
                        đó thì trên laptop 768px (dải ≈ 264px) riêng cụm tiêu đề đã ~150px và
                        nút "Nộp bài" bị đẩy ra ngoài tầm nhìn của một ô cuộn nhỏ. Tiêu đề là
                        NHẬN DẠNG, không phải nội dung cuộn cùng tệp đính kèm; `shrink-0` để
                        nó không bị co khi cột chật. `hidden lg:flex` vì dưới `lg` hai pane
                        xếp dọc và bản trên cùng của `ChallengeView` mới là bản đúng thứ tự
                        đọc — chỉ một trong hai bản hiện tại mỗi lúc. */}
                    {heading ? (
                        <div className="hidden shrink-0 flex-col gap-3 lg:flex">{heading}</div>
                    ) : null}

                    <div
                        className={cn(
                            "flex flex-col gap-4",
                            // With a thread underneath, the paper-side strip is capped so a
                            // long template list can never push the discussion out of the
                            // frame; with no thread it simply owns the whole column, exactly
                            // as the pane did before. Popup dùng CHUNG luật này: khung đề
                            // giờ cũng cao bằng dialog, nên cột phải phải cuộn trong chính
                            // nó — để nó cao tự nhiên là đẩy khung đề bẹp trở lại.
                            challengeId
                                ? "lg:max-h-[45%] lg:overflow-y-auto"
                                : "lg:min-h-0 lg:flex-1 lg:overflow-y-auto",
                        )}
                    >
                        {/* The templates come FIRST: they are what the candidate needs in hand to
                            start working, and the block below them is switched off anyway. */}
                        {attachments.length > 0 ? <PaperAttachments files={attachments} /> : null}

                        <PaperSubmitPanel />

                        {/* Hidden outright when the BE has no author card — see PaperUploader. */}
                        {author ? <PaperUploader author={author} createdAt={createdAt} /> : null}
                    </div>

                    {challengeId ? (
                        <div className="flex min-h-0 flex-1 flex-col border-t border-separator pt-4">
                            <ChallengePaperCommentThread
                                challengeId={challengeId}
                                inModal={inModal}
                            />
                        </div>
                    ) : null}
                </div>
            </div>
        </section>
    )
}

/**
 * The paper's INLINE half: every section the reader looks at, in the author's order.
 *
 * One section is the overwhelmingly common case (a set of scans, or a single PDF) and it
 * fills the pane exactly the way a single-file paper always has — same heights, same
 * pinned frame — so the multi-file path costs a one-page exam nothing. Two or more
 * sections turn the pane into a scrolling column of cards, each pinned to a readable
 * height, because a PDF appendix after the page images has to be reachable without
 * shrinking the pages to postage stamps.
 *
 * @param props.sections - inline sections from {@link groupChallengePaperFiles}, in order.
 * @param props.title - the challenge title, the fallback accessible name of a file.
 * @param props.expand - full-screen controls, forwarded to the ONE-section case only. A
 *   multi-section paper is a scrolling column of cards, and a card growing to the viewport
 *   from inside a column the reader is scrolling is a jump, not an expansion — so those
 *   viewers simply do not draw the button.
 */
const PaperSections = ({
    sections,
    title,
    expand,
}: {
    sections: Array<ChallengePaperSection>
    title: string
    expand?: ExamExpandControls
}) => {
    const only = sections.length === 1 ? sections[0] : undefined
    if (only) {
        return (
            <PaperSection
                section={only}
                title={title}
                className={
                    expand?.isExpanded ? expand.paneClassName : "h-[60dvh] lg:h-full"
                }
                expand={expand}
            />
        )
    }

    return (
        <div className="flex min-h-0 flex-col gap-3 overflow-y-auto p-3 lg:h-full">
            {sections.map((section) => (
                <div
                    key={sectionKey(section)}
                    className="h-[60dvh] shrink-0 overflow-hidden rounded-2xl border border-separator"
                >
                    <PaperSection section={section} title={title} className="h-full" />
                </div>
            ))}
        </div>
    )
}

/**
 * React key of an inline section — the id of the file it is built from (its FIRST file for
 * a picture run), which is stable across a re-order because it is the BE row id.
 *
 * @param section - the section to key.
 * @returns a stable key, `""` for the impossible empty run.
 */
const sectionKey = (section: ChallengePaperSection): string =>
    section.kind === "IMAGES" ? (section.files[0]?.id ?? "") : section.file.id

/**
 * ONE inline section, rendered by what it is — the only place `paperKind`'s answer is
 * consulted for a set file, and only ever to choose the RENDERER of a file the backend
 * already marked viewable.
 *
 * @param props.section - the section to render.
 * @param props.title - the challenge title, used when a file carries no filename.
 * @param props.className - the height the caller wants the frame to take.
 * @param props.expand - full-screen controls, when this section is allowed to offer them.
 */
const PaperSection = ({
    section,
    title,
    className,
    expand,
}: {
    section: ChallengePaperSection
    title: string
    className: string
    expand?: ExamExpandControls
}) => {
    const t = useTranslations("challenge")

    if (section.kind === "IMAGES") {
        return (
            <PaperImagesSection
                files={section.files}
                title={title}
                className={className}
                expand={expand}
            />
        )
    }

    /* No border/radius of its own — the frame around it owns them. */
    return (
        <iframe
            src={section.file.url}
            title={section.file.filename || t("paper.imageAlt", { title })}
            className={cn("w-full bg-default", className)}
        />
    )
}

/**
 * A run of consecutive exam PAGES, handed to the SHARED {@link ExamImageViewer} as one
 * album.
 *
 * This is the thing the single-`paperUrl` era could not do: the viewer's carets, `n/total`
 * counter and ←/→ keys were built for exactly this — a photographed multi-page
 * exam — and they light up on their own as soon as there is more than one page. The old
 * one-image array was never a design choice, only the shape of the contract; now that the
 * BE ships the ordered set, the pages go in as they are.
 *
 * The fetch WINDOW is the album's, reused rather than reinvented
 * ({@link nextAlbumLoadCount}): a 20-page paper must not pull twenty scans on mount for a
 * reader who is on page one.
 *
 * Each page's `caption` is its own filename — that is the viewer's alt text, and the
 * author's "trang-2.png" says more than a per-challenge label repeated N times. A file
 * with no filename falls back to the paper's alt copy.
 *
 * @param props.files - the pages of this run, in order.
 * @param props.title - the challenge title, used for the fallback alt text.
 * @param props.className - the height the caller wants the pane to take.
 * @param props.expand - full-screen controls; omitted → the viewer draws no expand button.
 */
const PaperImagesSection = ({
    files,
    title,
    className,
    expand,
}: {
    files: Array<ChallengePaperFileView>
    title: string
    className: string
    expand?: ExamExpandControls
}) => {
    const t = useTranslations("challenge")
    const [index, setIndex] = useState(0)
    const [loadedCount, setLoadedCount] = useState(ALBUM_INITIAL_LOAD)

    const images = useMemo<Array<ExamImageViewerImage>>(
        () =>
            files.map((file) => ({
                id: file.id,
                imageUrl: file.url,
                caption: file.filename || t("paper.imageAlt", { title }),
            })),
        [files, title, t],
    )

    const onIndexChange = useCallback(
        (next: number) => {
            setIndex(next)
            setLoadedCount((loaded) => nextAlbumLoadCount(loaded, next, files.length))
        },
        [files.length],
    )

    return (
        <ExamImageViewer
            images={images}
            index={index}
            onIndexChange={onIndexChange}
            loadedCount={loadedCount}
            className={cn("min-h-0", className)}
            isExpanded={expand?.isExpanded ?? false}
            onExpandedChange={expand?.setExpanded}
            areCommentsHidden={expand?.areCommentsHidden ?? false}
            onCommentsHiddenChange={expand?.setCommentsHidden}
        />
    )
}

/**
 * "Tệp đính kèm" — the paper's DOWNLOAD half: the templates a candidate fills in.
 *
 * Separated from the pages on purpose, and the whole point of the contract: an author's
 * `.docx` answer sheet used to be buried inside the same ZIP as the exam, so reading the
 * paper meant downloading and unzipping it first. Here the exam is already on screen and
 * this list is only what has to leave the browser — each row naming the file and its size,
 * so a 40 MB starter project is not a surprise on a phone connection.
 *
 * Nothing here decides WHAT belongs in the list: {@link groupChallengePaperFiles} put it
 * there because the SERVER said the file is download-only.
 *
 * @param props.files - the download-only files, in the author's order.
 */
const PaperAttachments = ({ files }: { files: Array<ChallengePaperFileView> }) => {
    const t = useTranslations("challenge")

    return (
        <div className="flex flex-col gap-3">
            <Typography type="body-sm" weight="semibold">
                {t("paper.attachments.title")}
            </Typography>
            <ul className="flex flex-col gap-2">
                {files.map((file) => (
                    <li
                        key={file.id}
                        className="flex items-center gap-3 rounded-2xl border border-default p-3"
                    >
                        <PaperclipIcon
                            aria-hidden
                            focusable="false"
                            className="size-5 shrink-0 text-muted"
                        />
                        <div className="flex min-w-0 flex-1 flex-col">
                            <Typography type="body-sm" truncate>
                                {file.filename || t("paper.attachments.unnamed")}
                            </Typography>
                            {file.sizeBytes > 0 ? (
                                <Typography type="body-xs" color="muted">
                                    {formatFileSize(file.sizeBytes)}
                                </Typography>
                            ) : null}
                        </div>
                        {/* `download` is a hint the storage host's cross-origin response may
                            ignore; the link still reaches the file either way. */}
                        <a
                            href={file.url}
                            download={file.filename || undefined}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex shrink-0 items-center gap-2 text-sm text-accent no-underline transition-colors hover:text-foreground"
                        >
                            <DownloadSimpleIcon className="size-4" aria-hidden focusable="false" />
                            {t("paper.attachments.download")}
                        </a>
                    </li>
                ))}
            </ul>
        </div>
    )
}

/**
 * "Người đăng" — who uploaded this paper.
 *
 * Rendered with the SHARED {@link UserLink} rather than a hand-rolled avatar + name pair,
 * so the uploader gets the same hovercard, profile link, avatar fallback and staff seal as
 * their name anywhere else on the platform. It appears twice for one person on purpose —
 * the avatar column and the name row — which is the arrangement `UserLink` documents for
 * exactly this shape.
 *
 * The caller renders this ONLY when the BE shipped a card, so there is no "unknown
 * uploader" state here: the block is present with a real identity, or it is absent.
 * `displayName` still falls back to the username because a profile row may carry one and
 * not the other, and the `@handle` line is dropped when there is no handle to print.
 *
 * **The posted time** sits under the handle as a relative label, produced by the SHARED
 * {@link formatRelativeTime} the album and the notification centre already use — same
 * "Người đăng … / 20 giờ trước" shape the FE album prints. The formatter returns `""` for
 * a missing or unparseable instant, and the line is dropped in that case, so a BE that
 * sends no timestamp (which is every BE today — `ChallengeView` projects no creation
 * instant) yields the uploader alone rather than an invented or "Invalid Date" time.
 *
 * @param props.author - The BE `ChallengeView.author` card.
 * @param props.createdAt - When the paper was posted (ISO-8601), or `null`.
 */
const PaperUploader = ({
    author,
    createdAt,
}: {
    author: ChallengeAuthorView
    createdAt?: string | null
}) => {
    const t = useTranslations("challenge")
    const locale = useLocale()
    const displayName = author.displayName || author.username || ""
    const postedAt = formatRelativeTime(createdAt, locale)

    return (
        <div className="flex items-start gap-3 border-t border-separator pt-4">
            <UserLink
                username={author.username}
                displayName={displayName}
                avatar={author.avatarUrl}
                seed={author.username ?? author.userId}
                hideName
                size="sm"
                classNames={{ avatar: "size-9" }}
            />
            <div className="flex min-w-0 flex-1 flex-col">
                <Typography type="body-xs" color="muted">
                    {t("paper.uploader")}
                </Typography>
                <UserLink
                    username={author.username}
                    displayName={displayName}
                    avatar={author.avatarUrl}
                    showAvatar={false}
                    size="sm"
                />
                {author.username ? (
                    <Typography type="body-xs" color="muted" truncate>
                        {`@${author.username}`}
                    </Typography>
                ) : null}
                {postedAt ? (
                    <Typography type="body-xs" color="muted">
                        {postedAt}
                    </Typography>
                ) : null}
            </div>
        </div>
    )
}

/**
 * The hand-in column: what a learner will use to send an answer for AI grading, rendered
 * today in its LOCKED state.
 *
 * Everything here is inert by construction, not merely by a disabled attribute: there is
 * no `<input type="file">` in the tree, no drop handler, no mutation hook, no endpoint.
 * The dropzone is a dashed panel and the action is a disabled `Button`, so a reader can
 * see exactly what the surface will do without being able to start it, and nothing has to
 * be un-wired on the day {@link IS_PAPER_GRADING_OPEN} flips — only wired.
 *
 * It is one block among three in the right column now (uploader + discussion sit below),
 * so the surface colour, padding and scroll live on the COLUMN — this block only lays out
 * its own contents. Nothing about the lock changed.
 */
const PaperSubmitPanel = () => {
    const t = useTranslations("challenge")
    const isOpen = IS_PAPER_GRADING_OPEN

    return (
        <div aria-label={t("paper.submit.region")} className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <Typography type="body-sm" weight="semibold">
                    {t("paper.submit.title")}
                </Typography>
                {!isOpen ? (
                    <Chip size="sm" variant="tertiary">
                        <span className="flex items-center gap-1">
                            <LockSimpleIcon
                                aria-hidden
                                focusable="false"
                                className="size-4"
                            />
                            {t("paper.submit.lockedBadge")}
                        </span>
                    </Chip>
                ) : null}
            </div>

            {/* The dropzone SHAPE, so the column is not an empty promise — dashed, muted
                and with no input behind it while grading is closed. */}
            <div
                aria-disabled={!isOpen}
                className={cn(
                    "flex flex-col items-center gap-2 rounded-2xl border border-dashed border-default p-6 text-center",
                    !isOpen && "opacity-60",
                )}
            >
                <UploadSimpleIcon
                    aria-hidden
                    focusable="false"
                    className="size-6 text-muted"
                />
                <Typography type="body-sm" color="muted">
                    {t("paper.submit.dropzone")}
                </Typography>
            </div>

            <Button variant="primary" isDisabled={!isOpen} className="w-full">
                {t("paper.submit.cta")}
            </Button>

            {/* The product decision, said out loud: read the paper, practise on your own —
                handing it in for an AI grade is not open yet. */}
            {!isOpen ? (
                <Typography type="body-xs" color="muted">
                    {t("paper.gradingLocked")}
                </Typography>
            ) : null}
        </div>
    )
}
