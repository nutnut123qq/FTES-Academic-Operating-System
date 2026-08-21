import { describe, expect, it } from "vitest"
import { avatarCropArea, avatarCoverScale, clampAvatarCropOffset } from "./avatarCrop"

describe("avatar crop geometry", () => {
    it("fits a portrait image to the square and lets it move only vertically", () => {
        const image = { width: 1000, height: 2000 }

        expect(avatarCoverScale(image, 400)).toBe(0.4)
        expect(clampAvatarCropOffset(image, 400, 1, { x: 100, y: 999 })).toEqual({
            x: 0,
            y: 200,
        })
        expect(avatarCropArea(image, 400, 1, { x: 0, y: 200 })).toEqual({
            x: 0,
            y: 0,
            size: 1000,
        })
    })

    it("fits a landscape image and maps a leftward pan to the right side of the source", () => {
        const area = avatarCropArea(
            { width: 2000, height: 1000 },
            400,
            1,
            { x: -200, y: 0 },
        )

        expect(area).toEqual({ x: 1000, y: 0, size: 1000 })
    })

    it("keeps the source crop in bounds when zooming and over-panning", () => {
        const area = avatarCropArea(
            { width: 1200, height: 1200 },
            400,
            2,
            { x: 9999, y: -9999 },
        )

        expect(area).toEqual({ x: 0, y: 600, size: 600 })
    })
})
