"use client"

import React from "react"
import { Accordion, Button, Chip, Skeleton, Typography, cn } from "@heroui/react"
import { ArrowLeftIcon, HammerIcon, MagnifyingGlassIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { useParams, useSearchParams } from "next/navigation"
import { Link, useRouter } from "@/i18n/navigation"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { MarkdownContent } from "@/components/reuseable/MarkdownContent"
import { SubjectWorkspaceShell } from "@/components/features/subject/SubjectWorkspaceShell"

import { useQueryChallengeSwr } from "../hooks/useQueryChallengeSwr"
import type { ChallengeDetail } from "../hooks/useQueryChallengeSwr"
import { challengeBackHref, challengeSubjectCode } from "./challengeBackHref"
import { ChallengePaper } from "./ChallengePaper"
import { classifyChallengePaper } from "./paperKind"
import { EssayChallengePanel } from "./EssayChallengePanel"
import { GradeCodePanel } from "./GradeCodePanel"
import { UiUxChallengeEditor } from "./UiUxChallengeEditor"

/** Brief accordion sections, mapped from the challenge detail. */
const BRIEF_SECTIONS = ["requirements", "steps", "hints"] as const

/** BE lifecycle statuses that have an i18n label (`challengeSystem.status.*`). */
const KNOWN_STATUSES = new Set(["PUBLISHED", "RUNNING", "CLOSED"])

/**
 * Loading skeleton mirroring the solve layout: header + brief + editor split.
 *
 * <p>`inModal` phải dùng CHUNG hộp neo với nội dung thật. Dialog cao 92vh và rộng ~96vw
 * ngay từ khung hình đầu, nên một khung xương bị `max-w-6xl` giữ ở 1152px + `p-6` sẽ nằm
 * lệch trên một hộp rỗng khổng lồ rồi "nở" ra khi dữ liệu về — nhấp nháy rõ mỗi lần mở.
 * Máng 16px của `.modal__dialog` đã là khung, nên trong dialog bỏ cả trần lẫn padding.
 */
const ChallengeViewSkeleton = ({ inModal = false }: { inModal?: boolean }) => (
    <div
        className={cn(
            "mx-auto flex w-full flex-col gap-6",
            inModal ? "min-h-0 flex-1" : "max-w-6xl p-6",
        )}
    >
        {/* header: back link, then a tight title↔meta cluster (mirrors the real header) */}
        <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-32 rounded-full" />
            <Skeleton className="h-8 w-72 rounded-large" />
            <Skeleton className="h-6 w-48 rounded-full" />
        </div>
        <div className="flex flex-col gap-3">
            <Skeleton className="h-12 w-full rounded-3xl" />
            <Skeleton className="h-12 w-full rounded-3xl" />
            <Skeleton className="h-12 w-full rounded-3xl" />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Skeleton className="h-[480px] w-full rounded-2xl" />
            <div className="flex flex-col gap-6">
                <Skeleton className="h-[320px] w-full rounded-2xl" />
                <Skeleton className="h-32 w-full rounded-2xl" />
            </div>
        </div>
    </div>
)

/** Brief accordions (Yêu cầu · Các bước · Gợi ý) — solve page = surface variant. */
const ChallengeBrief = ({ challenge }: { challenge: ChallengeDetail }) => {
    const t = useTranslations("challenge")
    return (
        <Accordion variant="surface" className="overflow-hidden border border-default">
            {BRIEF_SECTIONS.map((section) => (
                <Accordion.Item key={section} aria-label={t(`uiuxEditor.brief.${section}`)}>
                    <Accordion.Heading>
                        <Accordion.Trigger>
                            <div className="flex w-full items-center justify-between gap-3 text-start">
                                <span className="text-base font-semibold">
                                    {t(`uiuxEditor.brief.${section}`)}
                                </span>
                                <Accordion.Indicator />
                            </div>
                        </Accordion.Trigger>
                    </Accordion.Heading>
                    <Accordion.Panel>
                        <Accordion.Body>
                            <ul className="flex list-disc flex-col gap-2 ps-5">
                                {challenge[section].map((item, index) => (
                                    <li key={index} className="text-sm text-foreground">
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </Accordion.Body>
                    </Accordion.Panel>
                </Accordion.Item>
            ))}
        </Accordion>
    )
}

/**
 * Khối NHẬN DẠNG của đề: mã đề · chip (loại · trạng thái · tag) · đoạn mô tả.
 *
 * Tách riêng vì nó phải dựng được ở HAI chỗ tuỳ bề mặt. Trên trang
 * `/challenges/[challengeId]` nó vẫn đứng trên cùng như cũ; trong POPUP đề PE thì nó tụt
 * xuống đầu CỘT PHẢI của {@link ChallengePaper} — cả dải ngang trên cùng của dialog trả
 * hết cho khung xem đề, vốn là thứ người đọc mở popup lên để nhìn.
 *
 * Trả về FRAGMENT chứ không bọc thêm `div`: chỗ gọi tự quyết khoảng cách, nên trên trang
 * hai mảnh (cụm tiêu đề · mô tả) rơi thẳng vào cột `gap-6` và giữ NGUYÊN khoảng cách cũ.
 *
 * @param props.challenge - đề đang mở.
 * @param props.backLink - link "về danh sách"; chỉ trang mới có (popup đã có nút ×).
 */
const ChallengeHeading = ({
    challenge,
    backLink,
}: {
    challenge: ChallengeDetail
    backLink?: React.ReactNode
}) => {
    const tSystem = useTranslations("challengeSystem")
    return (
        <>
            <div className="flex flex-col gap-2">
                {backLink}
                <Typography type="h4" weight="bold">
                    {challenge.title}
                </Typography>
                <div className="flex flex-wrap items-center gap-2">
                    <Chip size="sm" variant="soft" color="accent">
                        {tSystem(`types.${challenge.type}`)}
                    </Chip>
                    <Chip
                        size="sm"
                        variant="soft"
                        color={challenge.status === "RUNNING" ? "success" : undefined}
                    >
                        {KNOWN_STATUSES.has(challenge.status)
                            ? tSystem(`status.${challenge.status}`)
                            : challenge.status}
                    </Chip>
                    {/* tags (`pe`, the subject code, …) — the same chips the list
                        filters on, so a paper's provenance is visible here too */}
                    {challenge.tags.map((tag) => (
                        <Chip key={tag.slug} size="sm" variant="tertiary">
                            {tag.label}
                        </Chip>
                    ))}
                </div>
            </div>

            {/* Đề bài có thể là markdown HOẶC HTML (admin soạn bằng rich-text editor) —
                render bằng MarkdownContent kẻo thẻ `<ul><li>` lòi ra dạng text.
                `math`: đây là ĐỀ BÀI — challenge gắn tag PE/FE mang đề toán, nên
                `$…$` phải được typeset thay vì hiện ra dạng LaTeX thô. */}
            {challenge.description ? (
                <MarkdownContent
                    allowHtml
                    math
                    markdown={challenge.description}
                    className="text-muted"
                />
            ) : null}
        </>
    )
}

/**
 * The type-specific SOLVE surface of an ordinary (paper-less) challenge: the live UI/UX
 * editor when the BE exposes a starter + target asset, the essay panel for `ESSAY`, the AI
 * code-grading panel for coding/SQL, a coming-soon panel otherwise.
 *
 * Nhánh `essay` phải đứng TRƯỚC nhánh coding và phải hỏi {@link ChallengeDetail.type} sau khi
 * `mapChallengeType` đã biết `"essay"`: trước đây mọi type BE lạ đều rơi về `"coding"`, nên
 * một đề tự luận mở ra trình soạn code kèm bộ chọn ngôn ngữ và nộp đi
 * `{payloadType:"CODE"}`. Bug im lặng — không lỗi, chỉ sai bề mặt.
 */
const ChallengeSolveSurface = ({ challenge }: { challenge: ChallengeDetail }) => {
    const t = useTranslations("challenge")

    if (challenge.type === "uiux" && challenge.targetImageUrl) {
        return <UiUxChallengeEditor challenge={challenge} />
    }
    if (challenge.type === "essay") {
        // `challenge.id` là SLUG — đúng thứ useQueryChallengeSubmissionSwr nhận (nó tự
        // getChallengeBySlug rồi mới đọc lượt nộp theo UUID).
        return <EssayChallengePanel challengeId={challenge.id} />
    }
    if (challenge.type === "coding" || challenge.type === "sql") {
        return <GradeCodePanel challenge={challenge} challengeId={challenge.challengeUuid} />
    }
    return (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-separator p-6 py-16 text-center">
            <HammerIcon className="size-8 text-muted" aria-hidden focusable="false" />
            <Typography type="body-sm" weight="semibold">
                {t("uiuxEditor.comingSoon.title")}
            </Typography>
            <Typography type="body-sm" color="muted">
                {t("uiuxEditor.comingSoon.description")}
            </Typography>
        </div>
    )
}

/** Props for {@link ChallengeView}. */
export interface ChallengeViewProps {
    /**
     * Which challenge to solve — the ROUTING SLUG, exactly what `/challenges/[challengeId]`
     * carries. Omitted on the route itself, where `useParams()` is the source of truth;
     * REQUIRED in a modal, which has no route segment to read.
     */
    challengeId?: string
    /**
     * The subject workspace the challenge was opened FROM (`CSD201`), the value the route
     * takes from `?subject=`. Omitted → the query string answers, so deep links keep
     * working unchanged. It is validated here either way ({@link challengeSubjectCode}):
     * a caller-supplied code goes through the same gate a hand-edited URL does.
     */
    subjectCode?: string | null
    /**
     * Rendered INSIDE a dialog rather than as a page. A modal is not a page, so it drops
     * the two page-frames — the subject rail around the view and the "back to the list"
     * link (the × already closes it) — and it stops pinning anything to the VIEWPORT: the
     * dialog box is what scrolls (see {@link ChallengePaper}).
     */
    inModal?: boolean
}

/**
 * The challenge solve view (§10) — `/challenges/[challengeId]`. Header + brief
 * accordions, then the type-specific solve surface: `uiux` gets the live
 * HTML/CSS/JS editor; other types show a coming-soon placeholder (out of scope).
 *
 * A challenge that carries an EXAM PAPER (`paperUrl` — a Practical Exam folded into the
 * challenge bank) replaces the solve surface entirely with {@link ChallengePaper}: the
 * paper to read on the left, the hand-in block on the right — laid out but switched off
 * while AI grading for papers is unsold (`IS_PAPER_GRADING_OPEN`). None of the code
 * solvers are reached for a paper-bearing challenge. An ordinary challenge carries no
 * paper, so nothing about the existing solvers changes.
 *
 * **The same view serves the ROUTE and a MODAL** — the way the community feed opens a post
 * in place: one component rendered in both, so the deep link `/challenges/<id>` and the
 * popup can never drift apart. What it needs from the URL (`challengeId`, `?subject=`) is
 * therefore accepted as PROPS and only FALLS BACK to `useParams()`/`useSearchParams()`,
 * which is what keeps the route caller (`page.tsx`) prop-less and unchanged. Opening the
 * modal does NOT change the URL; the route stays the deep link.
 *
 * @param props - {@link ChallengeViewProps}
 */
export const ChallengeView = ({
    challengeId: challengeIdProp,
    subjectCode: subjectCodeProp,
    inModal = false,
}: ChallengeViewProps = {}) => {
    const t = useTranslations("challenge")
    // ponytail: the hooks stay UNCONDITIONAL (rules of hooks) and simply lose to the
    // props — in a modal they read the host page's URL, which carries neither field.
    const routeParams = useParams<{ challengeId: string }>()
    const routeSearch = useSearchParams()
    const router = useRouter()
    const challengeId = challengeIdProp ?? routeParams.challengeId
    // Where the reader came from — see challengeBackHref.
    const subjectParam = subjectCodeProp ?? routeSearch.get("subject")
    const backHref = challengeBackHref(subjectParam)
    // …and the workspace they came from, which the page STAYS INSIDE (see below).
    const subjectCode = challengeSubjectCode(subjectParam)
    const { challenge, isLoading, error, mutate } = useQueryChallengeSwr(challengeId)

    /**
     * Does this challenge carry an exam paper? Read once: it picks the surface below AND
     * the page width — a paper is a two-pane reader (paper ⇄ discussion) that wants the
     * whole content column, the way the FE album does, while an ordinary solve surface
     * stays inside the comfortable `max-w-6xl` measure.
     */
    const hasPaper = challenge
        ? classifyChallengePaper(challenge.paperUrl, challenge.paperMime) !== "MISSING"
        : false

    /**
     * Cụm tiêu đề có tụt xuống cột phải của khung đề không?
     *
     * CHỈ trong popup và CHỈ khi thật sự có đề để xem: trên trang, dải trên cùng không
     * cạnh tranh với ai (khung đề đã cao bằng viewport), còn một challenge không kèm đề
     * thì chẳng có cột phải nào để tụt xuống.
     */
    const headingInPaperColumn = inModal && hasPaper

    const view = (
        <AsyncContent
            isLoading={isLoading}
            skeleton={<ChallengeViewSkeleton inModal={inModal} />}
            error={error}
            errorContent={{
                title: t("uiuxEditor.state.errorTitle"),
                onRetry: () => {
                    void mutate()
                },
                retryLabel: t("uiuxEditor.state.retry"),
                // Cùng hộp neo với nội dung thật: trong dialog thì căn giữa phần dialog còn
                // lại thay vì neo lên đỉnh một hộp rỗng 92vh.
                className: inModal ? "flex min-h-0 flex-1 items-center justify-center" : "p-6 py-16",
            }}
            isEmpty={!challenge}
            emptyContent={{
                icon: (
                    <MagnifyingGlassIcon className="size-8 text-muted" aria-hidden focusable="false" />
                ),
                title: t("uiuxEditor.state.notFound"),
                // ponytail: no way out offered INSIDE a dialog. The button navigates the
                // page the dialog is sitting on top of — so a reader who opened a challenge
                // that turns out to be missing would lose the page they came from, which is
                // the exact trap hiding the header's back link was meant to avoid. The ×
                // is the way out here; on the route the button is still the only one.
                action: inModal ? undefined : (
                    <Button
                        size="sm"
                        variant="secondary"
                        onPress={() => router.push(backHref)}
                    >
                        {t("uiuxEditor.backToCatalog")}
                    </Button>
                ),
                className: inModal ? "flex min-h-0 flex-1 items-center justify-center" : "p-6 py-16",
            }}
        >
            {challenge ? (
                <div
                    className={cn(
                        "mx-auto flex w-full flex-col gap-6",
                        // ponytail: a paper drops the measure cap instead of getting its
                        // own layout — 1152px minus the 400px discussion column left the
                        // exam pane narrower than the scan it has to show.
                        !hasPaper && "max-w-6xl",
                        // Trong dialog, cột này LẤY phần còn lại của dialog (`flex-1`) và
                        // giữ luôn phần cuộn — y cách `SubjectFeAlbum` nhận chiều cao từ
                        // dialog FE. Đó là cái cho khung đề bên dưới một chiều cao THẬT để
                        // `lg:flex-1` vào, thay vì mãi kẹt ở sàn `60dvh`. Không padding
                        // riêng: máng của `.modal__dialog` (16px, ghim ở globals.css) đã là
                        // cái khung rồi, thêm một lớp nữa chỉ bóp khung đề lại.
                        inModal ? "min-h-0 flex-1 overflow-y-auto" : "p-6",
                    )}
                >
                    {/* header: back link, then a tight title↔meta cluster.
                        In a modal the back link is dropped — the dialog's × (and Esc, and
                        the backdrop) is the way out, and a link that NAVIGATES would take
                        the reader off the page they popped this open from.

                        Popup + có đề (`headingInPaperColumn`): từ `lg` lên bản này BIẾN MẤT
                        và cụm tiêu đề được `ChallengePaper` vẽ lại ở đầu cột phải. Bản dưới
                        `lg` phải ở lại đúng chỗ này, vì khi hai pane xếp DỌC thì cột phải
                        nằm sau khung đề — để tiêu đề theo nó là bắt người đọc lướt qua cả
                        khung đề mới biết mình đang mở đề nào. `lg:hidden` là `display:none`
                        nên bản ẩn cũng rời khỏi cây a11y: tiêu đề vẫn chỉ được đọc MỘT lần. */}
                    {headingInPaperColumn ? (
                        <div className="flex flex-col gap-6 lg:hidden">
                            <ChallengeHeading challenge={challenge} />
                        </div>
                    ) : (
                        <ChallengeHeading
                            challenge={challenge}
                            backLink={
                                inModal ? undefined : (
                                    <Link
                                        href={backHref}
                                        className="flex w-fit items-center gap-2 text-sm text-muted no-underline transition-colors hover:text-foreground"
                                    >
                                        <ArrowLeftIcon
                                            className="size-4"
                                            aria-hidden
                                            focusable="false"
                                        />
                                        {t("uiuxEditor.backToCatalog")}
                                    </Link>
                                )
                            }
                        />
                    )}

                    {/* Structured brief (requirements/steps/hints) — only when the BE
                        challenge actually carries any; the public view carries none today. */}
                    {challenge.requirements.length > 0
                        || challenge.steps.length > 0
                        || challenge.hints.length > 0 ? (
                            <ChallengeBrief challenge={challenge} />
                        ) : null}

                    {/* An exam paper OWNS the surface: read it on the left, hand it in on the
                        right (gated until AI grading for papers is sold), so the code solvers
                        are not even reached for a paper-bearing challenge. */}
                    {hasPaper ? (
                        <ChallengePaper
                            paperUrl={challenge.paperUrl}
                            paperMime={challenge.paperMime}
                            // The rest of the paper (pages + templates) when the BE
                            // ships the set; `null` on an older one, which keeps the
                            // surface on its single-file behaviour.
                            paperFiles={challenge.paperFiles}
                            title={challenge.title}
                            // The comment endpoints bind a UUID, and `challenge.id` is
                            // the routing SLUG — the real id is `challengeUuid`.
                            challengeId={challenge.challengeUuid}
                            author={challenge.author}
                            createdAt={challenge.createdAt}
                            // Trong dialog khung đề đo theo CHÍNH dialog (`lg:flex-1` vào
                            // chiều cao 92vh mà dialog đã ghim) thay vì theo viewport.
                            inModal={inModal}
                            // …và cụm tiêu đề đi cùng xuống đầu cột phải, để dải ngang
                            // trên cùng thuộc về khung đề.
                            heading={
                                headingInPaperColumn ? (
                                    <ChallengeHeading challenge={challenge} />
                                ) : undefined
                            }
                        />
                    ) : (
                        <ChallengeSolveSurface challenge={challenge} />
                    )}
                </div>
            ) : null}
        </AsyncContent>
    )

    /**
     * Opened FROM a subject workspace (`?subject=CSD201`) → the page stays INSIDE that
     * workspace: the same {@link SubjectWorkspaceShell} the `/subjects/<code>/…` layout
     * mounts, reused as-is rather than copied, so the rail (Tổng quan · Thảo luận ·
     * Tài nguyên · Thực hành · Thành viên · Thống kê · Nghề nghiệp) is exactly the one
     * the reader just left — a challenge is reached from the Practice tab, and dropping
     * the rail on the way in made it feel like leaving the subject.
     *
     * No subject in the query (the global catalogue, a shared link) → no workspace to
     * claim, so the page stands on its own exactly as before.
     *
     * The rail marks "Thực hành" as the open area. It cannot work that out on its own —
     * it derives active from `pathname.startsWith("/subjects/<code>/<segment>")` and this
     * route lives at `/challenges/…`, so every row came up cold — hence the explicit
     * `activeSegment`: a challenge is only ever reached from that tab.
     *
     * A MODAL never mounts the rail, whatever the subject: the reader is still standing on
     * the workspace page underneath, so a second copy of its navigation inside the dialog
     * would be the same rail twice — and a dialog is one thing to do, not a whole page.
     */
    return subjectCode && !inModal ? (
        <SubjectWorkspaceShell subjectId={subjectCode} activeSegment="practice">
            {view}
        </SubjectWorkspaceShell>
    ) : (
        view
    )
}
