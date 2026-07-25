"use client"

import React, { useState } from "react"
import { Button, Chip, Modal, Skeleton, Typography } from "@heroui/react"
import { ArrowDownIcon, ArrowUpIcon, TrashIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import {
    reorderCollectionItems,
    type CollectionDetailResponse,
} from "@/modules/api/rest/resource"
import { useQueryCollectionDetailSwr } from "../hooks/useQueryCollectionDetailSwr"
import { resolveResourceErrorKey } from "../hooks/useQueryCollectionsSwr"

/** Props for {@link CollectionDetailModal}. */
export interface CollectionDetailModalProps {
    /** Selected collection id — `null` keeps the modal closed AND the fetch idle. */
    collectionId: string | null
    /** Row title from the list, shown while the detail is still loading. */
    fallbackTitle?: string
    /** Close handler. */
    onClose: () => void
    /** Called after an item was removed so the list can refresh its item count. */
    onChanged?: () => void
}

/** Loading skeleton — mirrors an item row (title + type chip). */
const ItemsSkeleton = () => (
    <div className="flex flex-col gap-2">
        {[0, 1, 2].map((row) => (
            <div
                key={row}
                className="flex items-center gap-3 rounded-2xl border border-separator p-3"
            >
                <Skeleton className="h-4 w-48 rounded-full" />
                <Skeleton className="ml-auto h-6 w-14 rounded-full" />
            </div>
        ))}
    </div>
)

/**
 * Collection detail (§5) opened by clicking a collection row: the real
 * `GET /api/v1/resources/collections/{id}` aggregate — each item links to
 * `/resources/{resourceId}`, can be removed, and can be moved up/down
 * (`PATCH /collections/{id}/items/reorder`, which takes the FULL ordered resource-id
 * list). Both writes are optimistic and roll back by re-fetching on failure.
 *
 * Up/down buttons instead of drag-and-drop: the BE only needs the resulting order,
 * and a keyboard/touch-reachable pair of buttons costs a fraction of a DnD stack.
 */
export const CollectionDetailModal = ({
    collectionId,
    fallbackTitle,
    onClose,
    onChanged,
}: CollectionDetailModalProps) => {
    const t = useTranslations("resourceHub")
    const { collection, items, isLoading, error, mutate, removeItem } =
        useQueryCollectionDetailSwr(collectionId)
    const [removingId, setRemovingId] = useState<string | null>(null)
    const [movingId, setMovingId] = useState<string | null>(null)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)

    const onRemove = async (resourceId: string) => {
        setRemovingId(resourceId)
        setErrorMessage(null)
        try {
            await removeItem(resourceId)
            onChanged?.()
        } catch (removeError) {
            setErrorMessage(
                `${t("collections.removeError")} ${t(`apiErrors.${resolveResourceErrorKey(removeError)}`)}`,
            )
        } finally {
            setRemovingId(null)
        }
    }

    /**
     * Moves one item one slot up (`direction = -1`) or down (`+1`).
     *
     * @param index - Current position of the item in the rendered list.
     * @param direction - `-1` up, `+1` down.
     */
    const onMove = async (index: number, direction: -1 | 1) => {
        const target = index + direction
        if (!collectionId || movingId || target < 0 || target >= items.length) {
            return
        }
        const reordered = [...items]
        const [moved] = reordered.splice(index, 1)
        reordered.splice(target, 0, moved)
        const orderedResourceIds = reordered.map((item) => item.resourceId)

        setMovingId(moved.resourceId)
        setErrorMessage(null)
        // optimistic: the list re-renders in the new order (sortOrder re-numbered so
        // a later re-fetch cannot disagree with what is on screen)
        const applyOrder = (current: CollectionDetailResponse | undefined) => {
            if (!current) {
                return current
            }
            return {
                ...current,
                items: reordered.map((item, sortOrder) => ({ ...item, sortOrder })),
            }
        }
        await mutate(applyOrder, { revalidate: false })
        try {
            await reorderCollectionItems(collectionId, { orderedResourceIds })
            onChanged?.()
        } catch (reorderError) {
            // rollback: re-fetch so the server order comes back
            await mutate()
            setErrorMessage(
                `${t("collections.reorderError")} ${t(`apiErrors.${resolveResourceErrorKey(reorderError)}`)}`,
            )
        } finally {
            setMovingId(null)
        }
    }

    return (
        <Modal
            isOpen={Boolean(collectionId)}
            onOpenChange={(open) => {
                if (!open) {
                    setErrorMessage(null)
                    onClose()
                }
            }}
        >
            <Modal.Backdrop>
                <Modal.Container>
                    <Modal.Dialog className="w-full max-w-2xl">
                        <Modal.Header>
                            <div className="flex flex-col gap-1">
                                <Typography type="body" weight="bold">
                                    {collection?.title || fallbackTitle || t("collections.title")}
                                </Typography>
                                {collection?.description ? (
                                    <Typography type="body-xs" color="muted">
                                        {collection.description}
                                    </Typography>
                                ) : null}
                            </div>
                        </Modal.Header>
                        <Modal.Body className="flex flex-col gap-3">
                            <AsyncContent
                                isLoading={isLoading && items.length === 0}
                                skeleton={<ItemsSkeleton />}
                                isEmpty={items.length === 0}
                                emptyContent={{ title: t("collections.emptyItems") }}
                                error={items.length === 0 ? error : undefined}
                                errorContent={{
                                    title: t("collections.loadDetailError"),
                                    description: error
                                        ? t(`apiErrors.${resolveResourceErrorKey(error)}`)
                                        : undefined,
                                    onRetry: () => void mutate(),
                                    retryLabel: t("hub.retry"),
                                }}
                            >
                                <div className="flex flex-col gap-2">
                                    {items.map((item, index) => (
                                        <div
                                            key={item.id}
                                            className="flex items-center gap-3 rounded-2xl border border-separator p-3"
                                        >
                                            <Link
                                                href={`/resources/${item.resourceId}`}
                                                className="min-w-0 flex-1 no-underline hover:underline"
                                                onClick={onClose}
                                            >
                                                <Typography type="body-sm" weight="medium" truncate>
                                                    {item.title}
                                                </Typography>
                                                {item.note ? (
                                                    <Typography type="body-xs" color="muted" truncate>
                                                        {item.note}
                                                    </Typography>
                                                ) : null}
                                            </Link>
                                            <Chip size="sm" variant="soft" color="accent">
                                                {item.type}
                                            </Chip>
                                            <Button
                                                variant="tertiary"
                                                size="sm"
                                                isIconOnly
                                                aria-label={t("collections.moveUp")}
                                                isDisabled={index === 0 || movingId !== null}
                                                onPress={() => void onMove(index, -1)}
                                            >
                                                <ArrowUpIcon
                                                    aria-hidden
                                                    focusable="false"
                                                    className="size-4"
                                                />
                                            </Button>
                                            <Button
                                                variant="tertiary"
                                                size="sm"
                                                isIconOnly
                                                aria-label={t("collections.moveDown")}
                                                isDisabled={
                                                    index === items.length - 1 || movingId !== null
                                                }
                                                onPress={() => void onMove(index, 1)}
                                            >
                                                <ArrowDownIcon
                                                    aria-hidden
                                                    focusable="false"
                                                    className="size-4"
                                                />
                                            </Button>
                                            <Button
                                                variant="tertiary"
                                                size="sm"
                                                isIconOnly
                                                aria-label={t("collections.removeItem")}
                                                isDisabled={removingId === item.resourceId}
                                                onPress={() => void onRemove(item.resourceId)}
                                            >
                                                <TrashIcon
                                                    aria-hidden
                                                    focusable="false"
                                                    className="size-4"
                                                />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </AsyncContent>
                            {errorMessage ? (
                                <div role="alert" className="text-xs text-danger">
                                    {errorMessage}
                                </div>
                            ) : null}
                        </Modal.Body>
                        <Modal.Footer className="justify-end">
                            <Button variant="ghost" onPress={onClose}>
                                {t("collections.close")}
                            </Button>
                        </Modal.Footer>
                    </Modal.Dialog>
                </Modal.Container>
            </Modal.Backdrop>
        </Modal>
    )
}
