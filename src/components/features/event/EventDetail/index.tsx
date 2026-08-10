"use client"

import React from "react"
import { Button, Chip, Typography, toast } from "@heroui/react"
import { CalendarIcon, LinkSimpleIcon, MapPinIcon, UsersIcon } from "@phosphor-icons/react"
import { useLocale, useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { formatDateTime } from "@/modules/dayjs"
import type { EventView } from "@/modules/api/rest/event"
import { TYPE_ICON } from "../typeIcons"
import { toEventType, toLocationType } from "../hooks/useQueryEventsSwr"
import { useQueryEventDetailSwr } from "../hooks/useQueryEventDetailSwr"
import { useMutateEventRegistrationSwr } from "../hooks/useMutateEventRegistrationSwr"

/** Trạng thái vòng đời của sự kiện có nhãn trong `eventSystem.statuses.*`. */
const KNOWN_STATUSES: ReadonlySet<string> = new Set([
    "draft",
    "published",
    "ongoing",
    "ended",
    "cancelled",
])

/**
 * Chi tiết sự kiện (§14) — `/events/{slug}`, đích của mọi card ở `EventCatalog`.
 * Đọc `GET /api/v1/event/events/{slug}`; đăng ký / huỷ đăng ký đi qua
 * {@link useMutateEventRegistrationSwr} (chung với card catalog).
 */
export const EventDetail = () => {
    const t = useTranslations("eventSystem")
    const { slug } = useParams<{ slug: string }>()
    const { event, isLoading, error, mutate } = useQueryEventDetailSwr(slug)

    return (
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6">
            <AsyncContent
                isLoading={isLoading && !event}
                skeleton={<EventDetailSkeleton />}
                error={event ? undefined : error}
                errorContent={{
                    title: t("detail.loadError"),
                    retryLabel: t("catalog.retry"),
                    onRetry: () => {
                        void mutate()
                    },
                }}
                isEmpty={!event}
                emptyContent={{
                    title: t("detail.notFound"),
                    description: t("detail.notFoundDescription"),
                }}
            >
                {event ? <EventDetailBody event={event} /> : null}
            </AsyncContent>
        </div>
    )
}

/** Props cho {@link EventDetailBody}. */
interface EventDetailBodyProps {
    /** Sự kiện đã tải xong. */
    event: EventView
}

/**
 * Thân trang khi đã có dữ liệu: hàng nhận diện (icon loại · tiêu đề · chip loại + trạng thái),
 * mô tả, rồi khối logistics (thời gian · hình thức · nơi diễn ra · số chỗ) và CTA đăng ký.
 */
const EventDetailBody = ({ event }: EventDetailBodyProps) => {
    const t = useTranslations("eventSystem")
    const locale = useLocale()
    const { submit, isPending } = useMutateEventRegistrationSwr()

    const type = toEventType(event.type)
    const TypeIcon = TYPE_ICON[type] ?? CalendarIcon
    const locationType = toLocationType(event.locationType)
    const rawStatus = (event.status ?? "").toLowerCase()
    // Sự kiện đã qua/huỷ → khoá đăng ký, chỉ hiện trạng thái. "ended"/"cancelled" là status BE
    // (scheduler flip khi qua endAt); fallback theo endAt đã-quá-khứ để bắt cả khi scheduler chưa
    // kịp flip (sự kiện quá ngày mà vẫn "published"). Khi đó nhãn chip cũng hiện "ended" cho khớp.
    const endPast = event.endAt ? new Date(event.endAt).getTime() < Date.now() : false
    const isCancelled = rawStatus === "cancelled"
    const isEnded = !isCancelled && (rawStatus === "ended" || endPast)
    const isOver = isEnded || isCancelled
    const status = isEnded ? "ended" : rawStatus

    // BE giữ lại hàng đăng ký cả khi đã huỷ/đã kết thúc, nên phải liệt kê THUẬN hai trạng thái
    // thật sự đang giữ chỗ. Tập đầy đủ của BE: CONFIRMED|WAITLISTED|CANCELLED|ATTENDED|NO_SHOW
    // (CHECK constraint V73) — ba cái sau đều KHÔNG được hiện CTA huỷ.
    const registration = (event.myRegistrationStatus ?? "").toUpperCase()
    const isRegistered = registration === "CONFIRMED" || registration === "WAITLISTED"

    // Thiếu `endAt` thì chỉ hiện giờ bắt đầu; thiếu cả `startAt` thì giấu luôn dòng thời gian.
    const startLabel = event.startAt ? formatDateTime(event.startAt, locale) : null
    const timeLabel =
        startLabel && event.endAt
            ? t("detail.timeRange", { start: startLabel, end: formatDateTime(event.endAt, locale) })
            : startLabel

    // ONLINE thì `venue` là link phòng họp — chỉ bấm được khi thực sự là URL http(s),
    // còn lại (ONSITE, hoặc BE ghi "Phòng 302") render như địa chỉ thường.
    const meetingUrl =
        locationType === "online" && /^https?:\/\//i.test(event.venue ?? "") ? event.venue : null

    const onToggleRegistration = async () => {
        const result = await submit(event.id, isRegistered ? "cancel" : "register")
        if (result === "failed") {
            toast.danger(isRegistered ? t("cancelError") : t("registerError"))
        }
    }

    return (
        <>
            <div className="flex items-start gap-3">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-large bg-accent/10 text-accent">
                    <TypeIcon size={24} aria-hidden focusable="false" />
                </div>
                <div className="flex min-w-0 flex-col gap-2">
                    <Typography type="h4" weight="bold">
                        {event.title}
                    </Typography>
                    <div className="flex flex-wrap items-center gap-2">
                        <Chip size="sm" variant="soft" color="accent">
                            {t(`types.${type}`)}
                        </Chip>
                        {KNOWN_STATUSES.has(status) ? (
                            <Chip size="sm" variant="soft">
                                {t(`statuses.${status}`)}
                            </Chip>
                        ) : null}
                    </div>
                </div>
            </div>

            {event.description ? (
                <Typography type="body-sm" color="muted">
                    {event.description}
                </Typography>
            ) : null}

            {/* logistics — mỗi dòng tự ẩn khi BE bỏ trống trường của nó (không bịa giá trị) */}
            <div className="flex flex-col gap-3 rounded-2xl border border-separator p-4">
                {timeLabel ? (
                    <div className="flex items-center gap-2">
                        <CalendarIcon size={16} className="shrink-0 text-muted" aria-hidden />
                        <Typography type="body-sm">{timeLabel}</Typography>
                    </div>
                ) : null}

                {locationType ? (
                    <div className="flex items-center gap-2">
                        <MapPinIcon size={16} className="shrink-0 text-muted" aria-hidden />
                        <Typography type="body-sm">{t(`locationTypes.${locationType}`)}</Typography>
                    </div>
                ) : null}

                {event.venue ? (
                    <div className="flex items-center gap-2">
                        <LinkSimpleIcon size={16} className="shrink-0 text-muted" aria-hidden />
                        {meetingUrl ? (
                            <a
                                href={meetingUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="min-w-0 truncate text-sm text-accent hover:underline"
                            >
                                {meetingUrl}
                            </a>
                        ) : (
                            <Typography type="body-sm" truncate>
                                {event.venue}
                            </Typography>
                        )}
                    </div>
                ) : null}

                {event.seatsLeft != null ? (
                    <div className="flex items-center gap-2">
                        <UsersIcon size={16} className="shrink-0 text-muted" aria-hidden />
                        <Typography type="body-sm">
                            {t("detail.seatsLeft", { count: event.seatsLeft })}
                        </Typography>
                    </div>
                ) : null}
            </div>

            {/* Sự kiện còn hiệu lực mới cho đăng ký/huỷ; đã kết thúc/đã huỷ thì trạng thái đã
                thể hiện ở chip trên đầu, không hiện CTA nữa. */}
            {isOver ? null : (
                <Button
                    variant={isRegistered ? "ghost" : "secondary"}
                    className="self-start"
                    isPending={isPending}
                    isDisabled={isPending}
                    onPress={() => void onToggleRegistration()}
                >
                    {isRegistered ? t("cancelRegistration") : t("register")}
                </Button>
            )}
        </>
    )
}

/** Skeleton khớp {@link EventDetailBody}: hàng nhận diện, mô tả, khối logistics, nút CTA. */
const EventDetailSkeleton = () => (
    <div className="flex flex-col gap-6">
        <div className="flex items-start gap-3">
            <Skeleton className="size-12 shrink-0 rounded-large" />
            <div className="flex min-w-0 flex-1 flex-col gap-2">
                <Skeleton.Typography type="h4" width="2/3" />
                <Skeleton.Chip />
            </div>
        </div>
        <Skeleton.Paragraph lines={3} />
        <div className="flex flex-col gap-3 rounded-2xl border border-separator p-4">
            <Skeleton.Typography type="body-sm" width="2/3" />
            <Skeleton.Typography type="body-sm" width="1/2" />
            <Skeleton.Typography type="body-sm" width="1/3" />
        </div>
        <Skeleton.Button width="w-32" />
    </div>
)
