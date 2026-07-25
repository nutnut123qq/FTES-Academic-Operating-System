"use client"

import React, { useCallback, useEffect, useState } from "react"
import { Button, Chip, Input, Label, Modal, Skeleton, TextField, Typography, toast } from "@heroui/react"
import { CheckIcon, PlusIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { RestError } from "@/modules/api/rest/client"
import { addCollectionItem } from "@/modules/api/rest/resource"
import { resolveResourceErrorKey, useQueryCollectionsSwr } from "../hooks/useQueryCollectionsSwr"

/** Props for {@link AddToCollectionModal}. */
export interface AddToCollectionModalProps {
    /** Resource being filed away (`AddItemRequest.resourceId`). */
    resourceId: string
    /** Whether the picker is open (the caller opens it behind `useRequireAuth().guard`). */
    isOpen: boolean
    /** Close handler. */
    onClose: () => void
}

/**
 * True when the BE refused the add because the resource is ALREADY in that
 * collection. The service answers `ResourceException.validation("Item đã có trong
 * collection")` → **400 `RESOURCE_VALIDATION`**, not the 409 one would expect from
 * a duplicate, so both are accepted here: 409 for the day the BE tightens it, and
 * the current 400 + error code. A bare 400 (missing/invalid body) is NOT a
 * duplicate and keeps the generic copy.
 */
export const isAlreadyInCollectionError = (error: unknown): boolean =>
    error instanceof RestError &&
    (error.status === 409 || (error.status === 400 && error.errorCode === "RESOURCE_VALIDATION"))

/** Loading skeleton — mirrors a picker row (title + trailing count chip). */
const PickerSkeleton = () => (
    <div className="flex flex-col gap-2">
        {[0, 1, 2].map((row) => (
            <div key={row} className="flex items-center gap-3 rounded-2xl border border-separator p-3">
                <Skeleton className="h-4 w-40 rounded-full" />
                <Skeleton className="ml-auto h-6 w-16 rounded-full" />
            </div>
        ))}
    </div>
)

/**
 * "Thêm vào bộ sưu tập" picker (§5) — lists the viewer's own collections
 * (`GET /api/v1/resources/collections/me`, shared with the collections page through
 * {@link useQueryCollectionsSwr} so both surfaces stay in sync) and files the open
 * resource into the picked one (`POST /resources/collections/{id}/items`).
 *
 * The item count bumps optimistically and is rolled back from the FRESH cache when
 * the POST fails; a duplicate (BE 400 `RESOURCE_VALIDATION`, see
 * {@link isAlreadyInCollectionError}) gets its own copy instead of the generic
 * failure. A collection can also be created inline — `create` (optimistic) followed
 * by the same add — so the flow never leaves the resource page.
 */
export const AddToCollectionModal = ({ resourceId, isOpen, onClose }: AddToCollectionModalProps) => {
    const t = useTranslations("resourceHub")
    const { collections, isLoading, error, authenticated, mutate, create } = useQueryCollectionsSwr()

    const [pendingId, setPendingId] = useState<string | null>(null)
    const [addedIds, setAddedIds] = useState<Array<string>>([])
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [newTitle, setNewTitle] = useState("")
    const [isCreating, setIsCreating] = useState(false)

    // a fresh session every time the picker opens (a stale "đã thêm" tick or error
    // line from the previous resource would lie about this one)
    useEffect(() => {
        if (isOpen) {
            setAddedIds([])
            setErrorMessage(null)
            setNewTitle("")
        }
    }, [isOpen])

    /**
     * Files the resource into one collection.
     *
     * @param collectionId - Target collection id (the BE path variable).
     */
    const addTo = useCallback(
        async (collectionId: string): Promise<void> => {
            if (pendingId) {
                return
            }
            setPendingId(collectionId)
            setErrorMessage(null)

            /** Patches the row's item count in place, always off the CURRENT cache. */
            const bump = async (delta: number) => {
                await mutate(
                    (current) =>
                        (current ?? []).map((row) =>
                            row.id === collectionId
                                ? { ...row, itemCount: Math.max(0, (row.itemCount ?? 0) + delta) }
                                : row,
                        ),
                    { revalidate: false },
                )
            }

            await bump(1)
            setAddedIds((current) => [...current, collectionId])
            try {
                await addCollectionItem(collectionId, { resourceId })
                toast.success(t("collections.addSuccess"))
            } catch (addError) {
                // rollback — the updater reads the fresh cache, so a concurrent
                // create/remove in the same list survives the revert
                await bump(-1)
                setAddedIds((current) => current.filter((id) => id !== collectionId))
                setErrorMessage(
                    isAlreadyInCollectionError(addError)
                        ? t("collections.addDuplicate")
                        : `${t("collections.addError")} ${t(`apiErrors.${resolveResourceErrorKey(addError)}`)}`,
                )
            } finally {
                setPendingId(null)
            }
        },
        [mutate, pendingId, resourceId, t],
    )

    /** Creates a collection from the inline field, then files the resource into it. */
    const onCreateAndAdd = useCallback(async (): Promise<void> => {
        const title = newTitle.trim()
        if (title === "" || isCreating) {
            return
        }
        setIsCreating(true)
        setErrorMessage(null)
        try {
            const created = await create({ title })
            setNewTitle("")
            await addTo(created.id)
        } catch (createError) {
            setErrorMessage(t(`apiErrors.${resolveResourceErrorKey(createError)}`))
        } finally {
            setIsCreating(false)
        }
    }, [addTo, create, isCreating, newTitle, t])

    return (
        <Modal
            isOpen={isOpen}
            onOpenChange={(open) => {
                if (!open && !pendingId && !isCreating) {
                    onClose()
                }
            }}
        >
            <Modal.Backdrop>
                <Modal.Container>
                    <Modal.Dialog className="w-full max-w-md">
                        <Modal.Header>
                            <Typography type="body" weight="bold">
                                {t("collections.addTitle")}
                            </Typography>
                        </Modal.Header>
                        <Modal.Body className="flex flex-col gap-4">
                            <AsyncContent
                                isLoading={isLoading && collections.length === 0}
                                skeleton={<PickerSkeleton />}
                                isEmpty={collections.length === 0}
                                emptyContent={{
                                    title: authenticated
                                        ? t("collections.empty")
                                        : t("collections.signInTitle"),
                                }}
                                error={collections.length === 0 ? error : undefined}
                                errorContent={{
                                    title: t("collections.loadError"),
                                    description: error
                                        ? t(`apiErrors.${resolveResourceErrorKey(error)}`)
                                        : undefined,
                                    onRetry: () => void mutate(),
                                    retryLabel: t("hub.retry"),
                                }}
                            >
                                <div className="flex flex-col gap-2">
                                    {collections.map((collection) => {
                                        const isAdded = addedIds.includes(collection.id)
                                        return (
                                            <div
                                                key={collection.id}
                                                className="flex items-center gap-3 rounded-2xl border border-separator p-3"
                                            >
                                                <div className="min-w-0 flex-1">
                                                    <Typography
                                                        type="body-sm"
                                                        weight="medium"
                                                        truncate
                                                    >
                                                        {collection.title}
                                                    </Typography>
                                                    <Typography type="body-xs" color="muted">
                                                        {t("collections.itemsCount", {
                                                            count: collection.count,
                                                        })}
                                                    </Typography>
                                                </div>
                                                {isAdded ? (
                                                    <Chip size="sm" variant="soft" color="accent">
                                                        <CheckIcon
                                                            aria-hidden
                                                            focusable="false"
                                                            className="size-3"
                                                        />
                                                        {t("collections.added")}
                                                    </Chip>
                                                ) : (
                                                    <Button
                                                        size="sm"
                                                        variant="secondary"
                                                        isPending={pendingId === collection.id}
                                                        isDisabled={pendingId !== null || isCreating}
                                                        onPress={() => void addTo(collection.id)}
                                                    >
                                                        {t("collections.addAction")}
                                                    </Button>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            </AsyncContent>

                            {/* create a collection without leaving the resource page */}
                            <div className="flex items-end gap-2">
                                <TextField
                                    variant="primary"
                                    className="min-w-0 flex-1"
                                    isDisabled={isCreating || pendingId !== null}
                                >
                                    <Label htmlFor="add-to-collection-new" className="text-sm">
                                        {t("collections.create")}
                                    </Label>
                                    <Input
                                        id="add-to-collection-new"
                                        variant="primary"
                                        placeholder={t("collections.namePlaceholder")}
                                        value={newTitle}
                                        onChange={(event) => setNewTitle(event.target.value)}
                                    />
                                </TextField>
                                <Button
                                    size="sm"
                                    variant="primary"
                                    isPending={isCreating}
                                    isDisabled={newTitle.trim() === "" || isCreating || pendingId !== null}
                                    onPress={() => void onCreateAndAdd()}
                                >
                                    <PlusIcon aria-hidden focusable="false" className="size-4" />
                                    {t("collections.createAndAdd")}
                                </Button>
                            </div>

                            {errorMessage ? (
                                <div role="alert" className="text-xs text-danger">
                                    {errorMessage}
                                </div>
                            ) : null}
                        </Modal.Body>
                        <Modal.Footer className="justify-end">
                            <Button
                                variant="ghost"
                                isDisabled={pendingId !== null || isCreating}
                                onPress={onClose}
                            >
                                {t("collections.close")}
                            </Button>
                        </Modal.Footer>
                    </Modal.Dialog>
                </Modal.Container>
            </Modal.Backdrop>
        </Modal>
    )
}
