"use client"

import React, { useCallback, useMemo } from "react"
import { Button, Chip, Typography, cn } from "@heroui/react"
import {
    ArrowSquareOutIcon,
    FileXIcon,
    FileZipIcon,
    LockSimpleIcon,
    UploadSimpleIcon,
} from "@phosphor-icons/react"
import { useLocale, useTranslations } from "next-intl"

import {
    ExamImageViewer,
    type ExamImageViewerImage,
} from "@/components/features/subject/ExamImageViewer"
import { UserLink } from "@/components/features/identity"
import { formatRelativeTime } from "@/components/features/community/hooks/relativeTime"
import type { ChallengeAuthorView } from "@/modules/api/rest/challenges/types"
import { ChallengePaperCommentThread } from "./ChallengePaperCommentThread"
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
}

/**
 * The EXAM PAPER of a challenge, read side by side with the hand-in block.
 *
 * This is what folding Practical Exams into the challenge bank means on screen: a `pe`-
 * tagged challenge carries the paper file, the learner reads it on the LEFT and hands an
 * answer in on the RIGHT — the two-pane shape of the FE album
 * (`SubjectFeAlbum`): `lg:grid-cols-[minmax(0,1fr)_400px]`, the paper letterboxed on
 * black, the right pane on `bg-overlay` scrolling on its own; below `lg` the panes stack
 * with the paper first, because the paper is what the reader came for.
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
 * The paper itself renders by kind ({@link classifyChallengePaper}):
 * - **IMAGE** → the SHARED {@link ExamImageViewer} — zoom, pan, ←/→, the lot, already
 *   built for photographed exam pages. The challenge contract carries a SINGLE
 *   `paperUrl`, so it is handed a one-image array and the viewer drops its own paging
 *   affordances (carets, counter, filmstrip) on its own. No `loadedCount`: a one-page
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
    title,
    challengeId,
    author,
    createdAt,
}: ChallengePaperProps) => {
    const t = useTranslations("challenge")
    const kind = classifyChallengePaper(paperUrl, paperMime)

    /**
     * The paper in the shape the shared viewer reads. ONE entry, because the challenge
     * contract carries one `paperUrl` — never fabricate a multi-page array here: the
     * viewer would then offer carets and a filmstrip for pages that do not exist. A
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
     * Only IMAGE and PDF earn the tall pinned frame: they are surfaces the reader scrolls
     * and zooms inside, so they want the viewport. The ARCHIVE / UNSUPPORTED cards are two
     * lines of copy — pinning them to `100dvh` would leave a screen of empty box.
     */
    const isFramed = kind === "IMAGE" || kind === "PDF"

    return (
        <section className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <Typography type="body" weight="semibold">
                    {t("paper.title")}
                </Typography>
                {openLink}
            </div>

            <div
                className={cn(
                    "overflow-hidden rounded-2xl border border-separator lg:grid lg:grid-cols-[minmax(0,1fr)_400px]",
                    // A 0-floored row + `min-h-0` on the pane are what let a PORTRAIT scan
                    // shrink to the frame instead of inflating it: a grid item's automatic
                    // minimum size is its CONTENT, and `overflow-hidden` then clips it.
                    isFramed
                        && "lg:h-[calc(100dvh-16rem)] lg:min-h-[26rem] lg:grid-rows-[minmax(0,1fr)]",
                )}
            >
                {/* LEFT — the paper */}
                {kind === "IMAGE" ? (
                    <ExamImageViewer
                        images={viewerImages}
                        index={0}
                        onIndexChange={onIndexChange}
                        className="h-[60dvh] min-h-0 lg:h-full"
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
                    paper up, then the discussion. The COLUMN owns the surface + its own
                    scroll so the three blocks stack inside one scrollable pane. */}
                <div className="flex min-h-0 flex-col gap-4 bg-overlay p-4 lg:overflow-y-auto">
                    <PaperSubmitPanel />

                    {/* Hidden outright when the BE has no author card — see PaperUploader. */}
                    {author ? <PaperUploader author={author} createdAt={createdAt} /> : null}

                    {challengeId ? (
                        <div className="border-t border-separator pt-4">
                            <ChallengePaperCommentThread challengeId={challengeId} />
                        </div>
                    ) : null}
                </div>
            </div>
        </section>
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
