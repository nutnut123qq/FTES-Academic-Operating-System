"use client"

import Image from "next/image"
import React from "react"
import { Chip, Typography, cn } from "@heroui/react"
import { Link } from "@/i18n/navigation"
import { pathConfig } from "@/resources/path"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import type { GoldenBoardEntryView } from "@/modules/api/rest/course"

/** Gold metallic gradient — built from the theme-aware `warning` token so it lives in both themes. */
const GOLD_TEXT_GRADIENT =
    "linear-gradient(100deg, color-mix(in srgb, var(--warning) 60%, var(--foreground)) 0%, var(--warning) 40%, color-mix(in srgb, var(--warning) 55%, white) 62%, var(--warning) 100%)"

/** How many rows get the podium card treatment; everything after falls into the numbered list. */
export const GOLDEN_BOARD_PODIUM_SIZE = 3

/**
 * Circular portrait for one board row: the BE-resolved `photoUrl` in a gold ring. On an image
 * error (or a row with no photo at all) an initials tile in the SAME ring keeps the podium
 * geometry intact, so a broken URL never collapses the card.
 *
 * NO zoom-crop. The pre-BE version carried a `zoomFace` flag that scaled legacy award POSTERS
 * (square images with the name baked in around y≈75%) 2.4× from origin 50% 28% to frame the face.
 * The BE row carries no equivalent field, and the URL is not a usable substitute — the photos the
 * board serves today are ordinary images, so guessing "poster" from the path would zoom 2.4× into
 * a normal portrait and mis-crop it. Admin now curates `photo_url` per row, so the fix for a bad
 * crop is a better photo, not a heuristic here.
 */
const BoardPortrait = ({
    src,
    name,
    className,
}: {
    src: string | null
    name: string
    className?: string
}) => {
    const [failed, setFailed] = React.useState(false)
    // LÙI HAI BẬC: optimizer lỗi → thử `<img>` thô → mới tới chữ viết tắt.
    //
    // Vì sao không gộp làm một: `onError` không phân biệt được "ảnh 404 thật" với "optimizer từ
    // chối vì host chưa khai trong remotePatterns". Gộp lại thì một host thiếu khai sẽ biến TOÀN
    // BỘ chân dung thành chữ viết tắt mà không lỗi nào kêu — đúng kiểu mất ảnh lặng lẽ đã xảy ra
    // với ảnh banner. Bậc giữa giữ được ảnh (nặng hơn), và chỉ khi chính ảnh hỏng mới rơi về chữ.
    const [optimizerFailed, setOptimizerFailed] = React.useState(false)
    // Reset on src change: a failed row must not stay stuck on initials when the board re-renders
    // with a different photo (term switch reuses the same DOM position).
    React.useEffect(() => {
        setFailed(false)
        setOptimizerFailed(false)
    }, [src])
    const initials = name
        .split(/\s+/)
        .map((word) => word[0])
        .slice(-2)
        .join("")
        .toUpperCase()
    return (
        <div className={cn("relative aspect-square overflow-hidden rounded-full border-2 border-warning/50", className)}>
            {failed || !src ? (
                <div className="flex size-full items-center justify-center bg-warning/10">
                    <span className="text-base font-semibold text-warning">{initials}</span>
                </div>
            ) : (
                optimizerFailed ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={src}
                        alt={name}
                        loading="lazy"
                        onError={() => setFailed(true)}
                        className="size-full object-cover"
                    />
                ) : (
                <Image
                    src={src}
                    alt={name}
                    fill
                    /* Chân dung tròn rộng ĐÚNG 112px (w-28). Trước đây là `<img>` thô nên nó tải
                       nguyên ảnh gốc do người dùng nộp — đo trên trang chủ có tấm 1.420 KB và
                       2.197 KB cho đúng cái vòng tròn 112px này. */
                    sizes="112px"
                    onError={() => setOptimizerFailed(true)}
                    className="object-cover"
                />
                )
            )}
        </div>
    )
}

/**
 * Podium stagger from `sm:` up: position 1 centre and raised, 2 left, 3 right. DOM order stays
 * 1, 2, 3, so the single-column mobile stack and screen readers both read the ranking straight down.
 *
 * Placed by explicit grid cell rather than flex `order` (what the pre-list version used): the cell
 * each position lands in is stated outright instead of being derived from source order, so the
 * mobile stack can never disagree with the desktop podium. Verified at 375 and 1280.
 */
const PODIUM_CELL = [
    "sm:col-start-2 sm:row-start-1",
    "sm:col-start-1 sm:row-start-1 sm:mt-6",
    "sm:col-start-3 sm:row-start-1 sm:mt-6",
] as const

/**
 * Name in the gold metallic gradient — shared by the podium cards and the list rows.
 *
 * `break-words` + a smaller card size below `md`: an uppercase full name at `text-xl` is wider
 * than a podium card once the grid goes three-up at `sm` (~190px of content), and the card is a
 * `flex-col items-center` box, so anything that cannot wrap simply hangs out of the border.
 * Desktop (`md:` and up) keeps the original `text-xl`.
 */
const GoldName = ({ name, size }: { name: string; size: "card" | "row" }) => (
    <span
        className={cn(
            "max-w-full break-words bg-clip-text font-bold uppercase tracking-wide text-transparent",
            size === "card" ? "text-lg md:text-xl" : "text-base",
        )}
        style={{ backgroundImage: GOLD_TEXT_GRADIENT }}
    >
        {name}
    </span>
)

/**
 * `text-warning` on the anchor exists only so the underline picks up the gold: the name inside is a
 * `text-transparent` + `bg-clip-text` gradient span, so the anchor colour never touches the glyphs —
 * but `text-decoration` is painted in the anchor's colour, and without this it draws a black rule
 * under gold text.
 *
 * Alignment is the CONTAINER's call, never baked in here: the anchor used to carry `self-start`,
 * which yanked the name of the one achiever that has a `href` to the left edge of an otherwise
 * centred podium card, so the podium read as three differently-aligned cards ("chữ lệch"). The
 * podium centres its children (`items-center`) and the list rows start-align theirs
 * (`items-start`), so both sides now stay consistent whether or not a name links anywhere.
 */
const MaybeLink = ({ href, children }: { href?: string; children: React.ReactNode }) =>
    href ? (
        <Link href={href} className="text-warning hover:underline">
            {children}
        </Link>
    ) : (
        <>{children}</>
    )

/**
 * Everything one row needs to render, normalised from the BE {@link GoldenBoardEntryView}:
 * the row's own `rank` is an admin sort key (0-based, may repeat), so the number shown on the
 * board is the POSITION, resolved once by {@link splitGoldenBoard}.
 */
interface BoardRow {
    key: string
    name: string
    photoUrl: string | null
    /** Big gold line on the podium; falls back to `badgeLabel` when the row has no headline. */
    headline: string | null
    /** Gold pill on a list row; falls back to `headline` so a row never loses its chip. */
    badge: string | null
    lines: Array<string>
    /** `/u/{username}` when the row links a real account, else undefined (plain text name). */
    href?: string
}

/** Display name for a row — the BE guarantees one for unlinked rows; guard anyway. */
const rowName = (entry: GoldenBoardEntryView): string =>
    entry.displayName?.trim() || entry.username?.trim() || "—"

const toRow = (entry: GoldenBoardEntryView): BoardRow => ({
    key: entry.id,
    name: rowName(entry),
    photoUrl: entry.photoUrl,
    headline: entry.headline ?? entry.badgeLabel,
    badge: entry.badgeLabel ?? entry.headline,
    lines: entry.lines ?? [],
    href: entry.username ? pathConfig().profile(entry.username).build() : undefined,
})

/**
 * Orders the board by `rank` and splits it into the podium (first
 * {@link GOLDEN_BOARD_PODIUM_SIZE}) and the numbered list (the rest).
 *
 * The BE already sorts `ORDER BY rank, created_at, id`; the sort here is a stable no-op on that
 * input and only exists so the split is driven by `rank` no matter who hands us the array.
 * Exported for the unit tests.
 */
export const splitGoldenBoard = (entries: ReadonlyArray<GoldenBoardEntryView>) => {
    const ordered = [...entries].sort((a, b) => a.rank - b.rank)
    return {
        podium: ordered.slice(0, GOLDEN_BOARD_PODIUM_SIZE).map(toRow),
        rest: ordered.slice(GOLDEN_BOARD_PODIUM_SIZE).map(toRow),
    }
}

/**
 * Podium card for the top three — large ringed portrait, gradient name, oversized highlight, then
 * the achievement lines. Carries a position badge so the board still reads 1, 2, 3 → 4, 5… once the
 * list below takes over.
 */
const PodiumCard = ({ row, position }: { row: BoardRow; position: number }) => (
    <div
        className={cn(
            "relative flex min-w-0 flex-col items-center gap-3 rounded-2xl border border-separator bg-surface/60 p-5 text-center backdrop-blur-md sm:p-6",
            "transition-all duration-300 hover:border-warning/40 hover:shadow-lg hover:shadow-warning/20",
            PODIUM_CELL[position],
        )}
    >
        <span className="absolute left-4 top-4 flex size-7 items-center justify-center rounded-full bg-warning/15 text-sm font-bold tabular-nums text-warning">
            {position + 1}
        </span>
        <div className="rounded-full border border-warning/30 p-2">
            <BoardPortrait src={row.photoUrl} name={row.name} className="w-28" />
        </div>
        <MaybeLink href={row.href}>
            <GoldName name={row.name} size="card" />
        </MaybeLink>
        {/* Long highlights ("CÓC VÀNG · SP25") drop a size so they never wrap inside the card.
            Below `md` that is not enough: `whitespace-nowrap` at `text-3xl` is wider than the card
            on a phone (and than a third of the row once the podium goes three-up at `sm`), and it
            escaped the border instead of clipping. So under `md` the highlight is allowed to wrap
            (`break-words`) at one size down; `md:` and up keep the original nowrap look exactly. */}
        {row.headline ? (
            <span
                className={cn(
                    "max-w-full break-words font-semibold text-warning md:whitespace-nowrap",
                    row.headline.length > 9 ? "text-xl md:text-2xl" : "text-2xl md:text-3xl",
                )}
            >
                {row.headline}
            </span>
        ) : null}
        {row.lines.length > 0 ? (
            <ul className="flex max-w-full flex-col gap-2 break-words">
                {row.lines.map((line, index) => (
                    <li key={index}>
                        <Typography type="body-sm" color="muted">
                            {line}
                        </Typography>
                    </li>
                ))}
            </ul>
        ) : null}
    </div>
)

/**
 * One list row — used from position 4 down, where the board turns into a plain leaderboard:
 * position number → identity (name + highlight chip) on the LEFT, achievement lines on the RIGHT.
 * No portrait: the podium above owns the faces.
 *
 * The two halves are one flex row from `sm` up (`sm:flex-row sm:justify-between`), so the lines sit
 * right-aligned against the card edge instead of stacking under the name and leaving the right half
 * of the row empty. Below `sm` the wrapper stays `flex-col`, so a phone gets the original stack
 * (lines under the name) rather than two squashed columns.
 */
const BoardListRow = ({ row, position }: { row: BoardRow; position: number }) => (
    <li className="flex items-start gap-3 p-4 transition-colors duration-300 hover:bg-warning/5 sm:gap-4 sm:px-5">
        <span className="w-6 shrink-0 pt-0.5 text-center text-base font-semibold tabular-nums text-muted">
            {position}
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
            {/* identity — start-aligned in both layouts (`items-start` also keeps the linked
                name from stretching, so its hover underline hugs the text) */}
            <div className="flex min-w-0 max-w-full flex-col items-start gap-2 break-words">
                <MaybeLink href={row.href}>
                    <Typography type="body" weight="semibold">
                        {row.name}
                    </Typography>
                </MaybeLink>
                {row.badge ? (
                    <Chip size="sm" variant="soft" color="warning">
                        {row.badge}
                    </Chip>
                ) : null}
            </div>
            {row.lines.length > 0 ? (
                <ul className="flex min-w-0 flex-col gap-2 break-words sm:items-end sm:text-right">
                    {row.lines.map((line, index) => (
                        <li key={index}>
                            <Typography type="body-sm" color="muted">
                                {line}
                            </Typography>
                        </li>
                    ))}
                </ul>
            ) : null}
        </div>
    </li>
)

/** Props for {@link GoldenBoard}. */
export interface GoldenBoardProps {
    /** One term's rows, straight from the BE (`GoldenBoardView.entries`). */
    entries: ReadonlyArray<GoldenBoardEntryView>
    className?: string
}

/**
 * "Bảng vàng FTES" — the SHARED board rendering: podium for the top three, plain numbered list
 * from the fourth row down. Used by BOTH the home-page Hall of Fame section (latest term) and the
 * `/goldenboard` page (any term), so the two surfaces can never drift apart.
 *
 * The board went all-list on 2026-08-10 and the team pushed back the same day: the top three keep
 * the card treatment ("hiện như cũ"), only the fourth row onward becomes a list. Gold = the
 * theme-aware `warning` token. All text lives in the DOM — nothing depends on typography baked into
 * a photo. Renders NOTHING for an empty board; the caller owns the empty state (the home section
 * hides itself, the page shows an EmptyContent).
 *
 * Copy comes entirely from the BE row (headline / badgeLabel / lines), so this component takes no
 * i18n namespace: the board's content is admin-curated data, not translated chrome.
 */
export const GoldenBoard = ({ entries, className }: GoldenBoardProps) => {
    const { podium, rest } = React.useMemo(() => splitGoldenBoard(entries), [entries])

    if (podium.length === 0) return null

    return (
        <div className={cn("flex w-full flex-col", className)}>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                {podium.map((row, position) => (
                    <PodiumCard key={row.key} row={row} position={position} />
                ))}
            </div>

            {rest.length > 0 && (
                <ol
                    start={podium.length + 1}
                    className="mx-auto mt-6 flex w-full max-w-3xl flex-col divide-y divide-separator overflow-hidden rounded-2xl border border-separator bg-surface/60 backdrop-blur-md"
                >
                    {rest.map((row, index) => (
                        <BoardListRow key={row.key} row={row} position={podium.length + index + 1} />
                    ))}
                </ol>
            )}
        </div>
    )
}

/** Layout-matching skeleton for {@link GoldenBoard} — three podium cards over three list rows. */
export const GoldenBoardSkeleton = () => (
    <div className="flex w-full flex-col">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {PODIUM_CELL.map((cell, index) => (
                <div
                    key={index}
                    className={cn(
                        "flex flex-col items-center gap-3 rounded-2xl border border-separator bg-surface/60 p-6",
                        cell,
                    )}
                >
                    <Skeleton className="size-32 rounded-full" />
                    <Skeleton className="h-6 w-32 rounded" />
                    <Skeleton className="h-8 w-24 rounded" />
                    <Skeleton className="h-4 w-40 rounded" />
                </div>
            ))}
        </div>
        <div className="mx-auto mt-6 flex w-full max-w-3xl flex-col divide-y divide-separator overflow-hidden rounded-2xl border border-separator bg-surface/60">
            {[0, 1, 2].map((row) => (
                <div key={row} className="flex items-start gap-4 p-4 sm:px-5">
                    <Skeleton className="h-5 w-6 rounded" />
                    <Skeleton className="h-5 w-40 rounded" />
                </div>
            ))}
        </div>
    </div>
)
