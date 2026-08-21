"use client"

import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    type KeyboardEvent,
    type PointerEvent,
} from "react"
import { Button, Modal, Typography } from "@heroui/react"
import { ArrowsOutCardinalIcon, MagnifyingGlassIcon } from "@phosphor-icons/react"
import {
    avatarCoverScale,
    avatarCropArea,
    clampAvatarCropOffset,
    type CropOffset,
    type CropSize,
} from "./avatarCrop"

const OUTPUT_SIZE = 512
const MIN_ZOOM = 1
const MAX_ZOOM = 3

export interface AvatarCropDialogLabels {
    title: string
    description: string
    dragHint: string
    zoom: string
    preview: string
    cancel: string
    apply: string
}

export interface AvatarCropDialogProps {
    file: File | null
    isOpen: boolean
    labels: AvatarCropDialogLabels
    onClose: () => void
    /** Persist the cropped file. Return false to keep the dialog open after an upload error. */
    onApply: (file: File) => boolean | Promise<boolean>
}

/** Render the chosen source rectangle into a compact square file accepted by the API. */
const renderAvatarFile = async (
    image: HTMLImageElement,
    sourceFile: File,
    area: ReturnType<typeof avatarCropArea>,
): Promise<File> => {
    const canvas = document.createElement("canvas")
    canvas.width = OUTPUT_SIZE
    canvas.height = OUTPUT_SIZE
    const context = canvas.getContext("2d")
    if (!context) {
        throw new Error("Canvas is unavailable")
    }

    context.imageSmoothingEnabled = true
    context.imageSmoothingQuality = "high"
    context.drawImage(
        image,
        area.x,
        area.y,
        area.size,
        area.size,
        0,
        0,
        OUTPUT_SIZE,
        OUTPUT_SIZE,
    )

    const outputType = sourceFile.type === "image/png" ? "image/png" : "image/jpeg"
    const extension = outputType === "image/png" ? "png" : "jpg"
    const stem = sourceFile.name.replace(/\.[^.]+$/, "") || "avatar"
    const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
            (result) => (result ? resolve(result) : reject(new Error("Could not crop image"))),
            outputType,
            0.92,
        )
    })

    return new File([blob], `${stem}-avatar.${extension}`, { type: outputType })
}

/** Facebook-style square cropper with pan, zoom and a circular avatar preview. */
export const AvatarCropDialog = ({
    file,
    isOpen,
    labels,
    onClose,
    onApply,
}: AvatarCropDialogProps) => {
    const viewportRef = useRef<HTMLDivElement>(null)
    const imageRef = useRef<HTMLImageElement>(null)
    const dragRef = useRef<{ pointerId: number; x: number; y: number; origin: CropOffset } | null>(null)
    const [objectUrl, setObjectUrl] = useState<string | null>(null)
    const [imageSize, setImageSize] = useState<CropSize>({ width: 0, height: 0 })
    const [viewportSize, setViewportSize] = useState(0)
    const [zoom, setZoom] = useState(MIN_ZOOM)
    const [offset, setOffset] = useState<CropOffset>({ x: 0, y: 0 })
    const [isApplying, setApplying] = useState(false)

    useEffect(() => {
        if (!file) {
            setObjectUrl(null)
            return
        }
        const url = URL.createObjectURL(file)
        setObjectUrl(url)
        setImageSize({ width: 0, height: 0 })
        setZoom(MIN_ZOOM)
        setOffset({ x: 0, y: 0 })
        return () => URL.revokeObjectURL(url)
    }, [file])

    useEffect(() => {
        const viewport = viewportRef.current
        if (!viewport) {
            return
        }
        const measure = () => setViewportSize(viewport.getBoundingClientRect().width)
        measure()
        const observer = new ResizeObserver(measure)
        observer.observe(viewport)
        return () => observer.disconnect()
    }, [isOpen])

    const safeOffset = useMemo(
        () => clampAvatarCropOffset(imageSize, viewportSize, zoom, offset),
        [imageSize, offset, viewportSize, zoom],
    )
    const displayScale = avatarCoverScale(imageSize, viewportSize) * zoom

    const updateOffset = useCallback(
        (next: CropOffset) => {
            setOffset(clampAvatarCropOffset(imageSize, viewportSize, zoom, next))
        },
        [imageSize, viewportSize, zoom],
    )

    const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
        event.currentTarget.setPointerCapture(event.pointerId)
        dragRef.current = {
            pointerId: event.pointerId,
            x: event.clientX,
            y: event.clientY,
            origin: safeOffset,
        }
    }

    const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
        const drag = dragRef.current
        if (!drag || drag.pointerId !== event.pointerId) {
            return
        }
        updateOffset({
            x: drag.origin.x + event.clientX - drag.x,
            y: drag.origin.y + event.clientY - drag.y,
        })
    }

    const finishPointer = (event: PointerEvent<HTMLDivElement>) => {
        if (dragRef.current?.pointerId === event.pointerId) {
            dragRef.current = null
        }
    }

    const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        const step = event.shiftKey ? 24 : 8
        const direction: Record<string, CropOffset> = {
            ArrowLeft: { x: step, y: 0 },
            ArrowRight: { x: -step, y: 0 },
            ArrowUp: { x: 0, y: step },
            ArrowDown: { x: 0, y: -step },
        }
        const delta = direction[event.key]
        if (!delta) {
            return
        }
        event.preventDefault()
        updateOffset({ x: safeOffset.x + delta.x, y: safeOffset.y + delta.y })
    }

    const handleApply = async () => {
        const image = imageRef.current
        if (!file || !image || !imageSize.width || !viewportSize) {
            return
        }
        setApplying(true)
        try {
            const cropped = await renderAvatarFile(
                image,
                file,
                avatarCropArea(imageSize, viewportSize, zoom, safeOffset),
            )
            const applied = await onApply(cropped)
            if (applied) {
                onClose()
            }
        } finally {
            setApplying(false)
        }
    }

    return (
        <Modal
            isOpen={isOpen}
            onOpenChange={(open) => {
                if (!open && !isApplying) {
                    onClose()
                }
            }}
        >
            <Modal.Backdrop>
                <Modal.Container>
                    <Modal.Dialog className="w-full max-w-lg">
                        <Modal.Header className="flex flex-col items-start gap-1">
                            <Typography type="body" weight="bold">
                                {labels.title}
                            </Typography>
                            <Typography type="body-sm" color="muted">
                                {labels.description}
                            </Typography>
                        </Modal.Header>
                        <Modal.Body className="flex flex-col gap-5">
                            <div
                                ref={viewportRef}
                                role="application"
                                tabIndex={0}
                                aria-label={labels.dragHint}
                                onPointerDown={handlePointerDown}
                                onPointerMove={handlePointerMove}
                                onPointerUp={finishPointer}
                                onPointerCancel={finishPointer}
                                onKeyDown={handleKeyDown}
                                className="relative mx-auto aspect-square w-full max-w-80 touch-none cursor-grab overflow-hidden rounded-2xl bg-black outline-none ring-accent focus-visible:ring-2 active:cursor-grabbing"
                            >
                                {objectUrl ? (
                                    <img
                                        ref={imageRef}
                                        src={objectUrl}
                                        alt=""
                                        draggable={false}
                                        onLoad={(event) => {
                                            setImageSize({
                                                width: event.currentTarget.naturalWidth,
                                                height: event.currentTarget.naturalHeight,
                                            })
                                        }}
                                        className="pointer-events-none absolute left-1/2 top-1/2 max-w-none select-none"
                                        style={{
                                            width: imageSize.width * displayScale,
                                            height: imageSize.height * displayScale,
                                            transform: `translate(calc(-50% + ${safeOffset.x}px), calc(-50% + ${safeOffset.y}px))`,
                                        }}
                                    />
                                ) : null}
                                <div
                                    aria-hidden
                                    className="pointer-events-none absolute inset-0 rounded-full shadow-[0_0_0_999px_rgba(0,0,0,0.58)] ring-2 ring-white/90"
                                />
                                <div className="pointer-events-none absolute inset-x-3 bottom-3 flex items-center justify-center gap-1.5 rounded-full bg-black/65 px-3 py-1.5 text-xs text-white backdrop-blur-sm">
                                    <ArrowsOutCardinalIcon aria-hidden className="size-4" />
                                    {labels.dragHint}
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <MagnifyingGlassIcon aria-hidden className="size-5 shrink-0 text-muted" />
                                <label htmlFor="avatar-crop-zoom" className="sr-only">
                                    {labels.zoom}
                                </label>
                                <input
                                    id="avatar-crop-zoom"
                                    type="range"
                                    min={MIN_ZOOM}
                                    max={MAX_ZOOM}
                                    step={0.01}
                                    value={zoom}
                                    onChange={(event) => {
                                        const nextZoom = Number(event.target.value)
                                        setZoom(nextZoom)
                                        setOffset((current) =>
                                            clampAvatarCropOffset(imageSize, viewportSize, nextZoom, current),
                                        )
                                    }}
                                    className="h-2 w-full cursor-pointer accent-accent"
                                />
                                <Typography type="body-xs" color="muted" className="w-10 text-right tabular-nums">
                                    {zoom.toFixed(1)}×
                                </Typography>
                            </div>

                            <div className="flex items-center gap-3 rounded-xl bg-surface-secondary p-3">
                                <div className="size-14 shrink-0 overflow-hidden rounded-full ring-2 ring-separator">
                                    {objectUrl ? (
                                        <img
                                            src={objectUrl}
                                            alt=""
                                            draggable={false}
                                            className="pointer-events-none relative left-1/2 top-1/2 max-w-none select-none"
                                            style={{
                                                width: imageSize.width * displayScale * (56 / Math.max(1, viewportSize)),
                                                height: imageSize.height * displayScale * (56 / Math.max(1, viewportSize)),
                                                transform: `translate(calc(-50% + ${safeOffset.x * 56 / Math.max(1, viewportSize)}px), calc(-50% + ${safeOffset.y * 56 / Math.max(1, viewportSize)}px))`,
                                            }}
                                        />
                                    ) : null}
                                </div>
                                <div>
                                    <Typography type="body-sm" weight="medium">
                                        {labels.preview}
                                    </Typography>
                                    <Typography type="body-xs" color="muted">
                                        512 × 512 px
                                    </Typography>
                                </div>
                            </div>
                        </Modal.Body>
                        <Modal.Footer className="justify-end gap-2">
                            <Button variant="ghost" size="sm" onPress={onClose} isDisabled={isApplying}>
                                {labels.cancel}
                            </Button>
                            <Button
                                variant="primary"
                                size="sm"
                                onPress={handleApply}
                                isPending={isApplying}
                                isDisabled={isApplying || !imageSize.width}
                            >
                                {labels.apply}
                            </Button>
                        </Modal.Footer>
                    </Modal.Dialog>
                </Modal.Container>
            </Modal.Backdrop>
        </Modal>
    )
}
