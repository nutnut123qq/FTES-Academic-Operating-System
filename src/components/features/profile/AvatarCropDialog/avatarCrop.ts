/** A width/height pair in image or viewport pixels. */
export interface CropSize {
    width: number
    height: number
}
/** The user-controlled translation of the image inside the crop viewport. */
export interface CropOffset {
    x: number
    y: number
}

/** Source-image rectangle that should be drawn into the square avatar output. */
export interface AvatarCropArea {
    x: number
    y: number
    size: number
}

/** Keep a number inside an inclusive range. */
const clamp = (value: number, min: number, max: number): number =>
    Math.min(max, Math.max(min, value))

/** Scale needed for an image to cover a square viewport without empty edges. */
export const avatarCoverScale = (image: CropSize, viewportSize: number): number => {
    if (image.width <= 0 || image.height <= 0 || viewportSize <= 0) {
        return 1
    }
    return Math.max(viewportSize / image.width, viewportSize / image.height)
}

/**
 * Limit panning so the crop viewport never moves beyond the image. Portrait images
 * can move vertically, landscape images horizontally, and square images only move
 * after the user zooms in.
 */
export const clampAvatarCropOffset = (
    image: CropSize,
    viewportSize: number,
    zoom: number,
    offset: CropOffset,
): CropOffset => {
    const scale = avatarCoverScale(image, viewportSize) * Math.max(1, zoom)
    const maxX = Math.max(0, (image.width * scale - viewportSize) / 2)
    const maxY = Math.max(0, (image.height * scale - viewportSize) / 2)

    return {
        x: clamp(offset.x, -maxX, maxX),
        y: clamp(offset.y, -maxY, maxY),
    }
}

/** Convert the visible square viewport back to coordinates in the original image. */
export const avatarCropArea = (
    image: CropSize,
    viewportSize: number,
    zoom: number,
    offset: CropOffset,
): AvatarCropArea => {
    const safeOffset = clampAvatarCropOffset(image, viewportSize, zoom, offset)
    const scale = avatarCoverScale(image, viewportSize) * Math.max(1, zoom)
    const size = Math.min(image.width, image.height, viewportSize / scale)

    return {
        x: clamp((image.width - size) / 2 - safeOffset.x / scale, 0, image.width - size),
        y: clamp((image.height - size) / 2 - safeOffset.y / scale, 0, image.height - size),
        size,
    }
}
