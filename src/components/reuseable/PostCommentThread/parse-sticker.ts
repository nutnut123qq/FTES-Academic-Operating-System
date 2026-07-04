/** Match a sticker token emitted by the composer: `![alt](/stickers/<file>.svg)`. */
const STICKER_TOKEN_RE = /!\[([^\]]*)\]\((\/stickers\/([\w-]+\.svg))\)/

/** Result of parsing a comment body for a sticker token. */
export interface ParsedSticker {
    /** Plain text left after removing the sticker token. */
    plainText: string
    /** Sticker asset filename (e.g. `heart.svg`), or null if no token. */
    stickerFile: string | null
    /** Markdown alt text captured from the token, or null if no token. */
    stickerAlt: string | null
}

/**
 * Extract at most one sticker token from a comment body.
 *
 * @param text - The raw comment text (may include a sticker token).
 * @returns The plain text remainder and any sticker file/alt found.
 */
export const parseStickerFromText = (text: string): ParsedSticker => {
    const match = STICKER_TOKEN_RE.exec(text)
    if (!match) {
        return { plainText: text, stickerFile: null, stickerAlt: null }
    }
    const plainText = text.replace(match[0], "").trim()
    return {
        plainText,
        stickerFile: match[3] ?? null,
        stickerAlt: match[1] ?? null,
    }
}

/* Self-check: assert parser behavior for token and no-token inputs. */
const mixed = parseStickerFromText("Hay quá ![Yêu thích](/stickers/heart.svg)")
if (mixed.plainText !== "Hay quá" || mixed.stickerFile !== "heart.svg" || mixed.stickerAlt !== "Yêu thích") {
    throw new Error(`parseStickerFromText self-check failed for mixed input: ${JSON.stringify(mixed)}`)
}

const onlySticker = parseStickerFromText("![Thích](/stickers/thumbs-up.svg)")
if (onlySticker.plainText !== "" || onlySticker.stickerFile !== "thumbs-up.svg" || onlySticker.stickerAlt !== "Thích") {
    throw new Error(`parseStickerFromText self-check failed for sticker-only input: ${JSON.stringify(onlySticker)}`)
}

const plain = parseStickerFromText("Cảm ơn bạn")
if (plain.plainText !== "Cảm ơn bạn" || plain.stickerFile !== null || plain.stickerAlt !== null) {
    throw new Error(`parseStickerFromText self-check failed for plain input: ${JSON.stringify(plain)}`)
}
