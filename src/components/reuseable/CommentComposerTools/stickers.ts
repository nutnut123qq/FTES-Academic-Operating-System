import type { Sticker } from "./types"

/** Raw catalog: id maps to a public `/stickers/<file>` asset and an i18n label key. */
export interface StickerCatalogItem {
    id: string
    file: string
    labelKey: string
}

export const STICKER_CATALOG: Array<StickerCatalogItem> = [
    { id: "heart", file: "heart.svg", labelKey: "engagement.stickers.heart" },
    { id: "thumbsUp", file: "thumbs-up.svg", labelKey: "engagement.stickers.thumbsUp" },
    { id: "thumbsDown", file: "thumbs-down.svg", labelKey: "engagement.stickers.thumbsDown" },
    { id: "fire", file: "fire.svg", labelKey: "engagement.stickers.fire" },
    { id: "star", file: "star.svg", labelKey: "engagement.stickers.star" },
    { id: "partyPopper", file: "party-popper.svg", labelKey: "engagement.stickers.partyPopper" },
    { id: "laugh", file: "laugh.svg", labelKey: "engagement.stickers.laugh" },
    { id: "smile", file: "smile.svg", labelKey: "engagement.stickers.smile" },
    { id: "angry", file: "angry.svg", labelKey: "engagement.stickers.angry" },
    { id: "sunglasses", file: "sunglasses.svg", labelKey: "engagement.stickers.sunglasses" },
    { id: "robotFaceHappy", file: "robot-face-happy.svg", labelKey: "engagement.stickers.robotFaceHappy" },
    { id: "gift", file: "gift.svg", labelKey: "engagement.stickers.gift" },
    { id: "coffee", file: "coffee.svg", labelKey: "engagement.stickers.coffee" },
    { id: "music", file: "music.svg", labelKey: "engagement.stickers.music" },
    { id: "zap", file: "zap.svg", labelKey: "engagement.stickers.zap" },
    { id: "trophy", file: "trophy.svg", labelKey: "engagement.stickers.trophy" },
]

/** Public URL for a sticker SVG asset. */
export const stickerImagePath = (file: string): string => `/stickers/${file}`

/** Build a localized sticker list from a translator bound to `communityHub`. */
export const localizeStickers = (
    catalog: Array<StickerCatalogItem>,
    t: (key: string) => string,
): Array<Sticker> =>
    catalog.map((item) => ({
        id: item.id,
        file: item.file,
        label: t(item.labelKey),
    }))
