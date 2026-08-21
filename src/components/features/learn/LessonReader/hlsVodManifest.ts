export interface PreparedHlsSource {
    url: string
    expiresAtMs: number | null
    /** Chính sách cửa sổ ký mà stream service công bố trong manifest (null = server đời cũ). */
    windowPolicy: HlsWindowPolicy | null
    dispose: () => void
}

/**
 * `#EXT-X-FTES-WINDOW:lead=120,ttl=120` — stream service công bố cửa sổ ký của nó.
 *
 * Token của mỗi nhóm segment chỉ có hiệu lực quanh lúc người xem đi tới đoạn đó: sớm nhất là
 * `lead` giây trước, và sống thêm `ttl` giây. Trình phát cần hai con số này để TỰ xin manifest mới
 * (neo lại tại chỗ vừa tua) trước khi CDN kịp trả 403 — nếu đợi 403 thì người tua sẽ thấy video
 * khựng rồi mới chạy.
 */
export interface HlsWindowPolicy {
    leadSeconds: number
    ttlSeconds: number
}

export const getHlsWindowPolicy = (manifest: string): HlsWindowPolicy | null => {
    const line = manifest
        .split(/\r?\n/)
        .map((candidate) => candidate.trim())
        .find((candidate) => candidate.startsWith("#EXT-X-FTES-WINDOW:"))
    if (!line) return null

    const values = new Map(line
        .slice("#EXT-X-FTES-WINDOW:".length)
        .split(",")
        .map((pair) => pair.split("=") as [string, string])
        .filter((pair) => pair.length === 2)
        .map(([key, value]) => [key.trim(), Number(value)] as const))
    const leadSeconds = values.get("lead")
    const ttlSeconds = values.get("ttl")
    if (!Number.isFinite(leadSeconds) || !Number.isFinite(ttlSeconds)) return null

    return { leadSeconds: leadSeconds as number, ttlSeconds: ttlSeconds as number }
}

/**
 * Gắn mốc đang xem (`at`) vào URL manifest, để stream service ký cửa sổ quanh CHỖ ĐÓ thay vì quanh
 * đầu bài. Đây là thứ làm cho việc tua tới phút 40 phát được ngay.
 *
 * Chỉ đụng vào URL của stream service (nhận ra bằng tham số `grant`). URL ký thẳng từ kho (S3/R2)
 * có chữ ký phủ luôn query string — thêm một tham số vào đó là hỏng chữ ký, đổi một video đang chạy
 * lấy một lỗi 403.
 */
export const withPlaybackAnchor = (url: string, seconds: number): string => {
    try {
        const parsed = new URL(url)
        if (!parsed.searchParams.has("grant")) return url
        parsed.searchParams.set("at", String(Math.max(0, Math.floor(seconds))))
        return parsed.href
    } catch {
        return url
    }
}

const NOOP = () => undefined

const decodeTokenExpiryMs = (token: string): number | null => {
    for (const tokenPart of token.split(".")) {
        try {
            const encoded = tokenPart.replace(/-/g, "+").replace(/_/g, "/")
            const padded = encoded.padEnd(Math.ceil(encoded.length / 4) * 4, "=")
            const payload = JSON.parse(atob(padded)) as { e?: unknown; exp?: unknown }
            const expiry = typeof payload.e === "number" ? payload.e : payload.exp
            if (typeof expiry === "number") return expiry * 1000
        } catch {
            // JWT headers/signatures and opaque signature parts are not JSON expiry payloads.
        }
    }

    return null
}

export const getHlsUrlTokenExpiryMs = (url: string): number | null => {
    try {
        const parameters = new URL(url).searchParams
        for (const parameter of ["t", "grant", "token"]) {
            const token = parameters.get(parameter)
            const expiry = token ? decodeTokenExpiryMs(token) : null
            if (expiry !== null) return expiry
        }
    } catch {
        return null
    }

    return null
}

type HlsErrorLike = {
    response?: { code?: number; status?: number }
    networkDetails?: { status?: number; statusCode?: number }
}

/** hls.js exposes CDN status in different fields for fetch and XHR loaders. */
export const getHlsErrorStatus = (data: unknown): number | null => {
    const error = data as HlsErrorLike
    const statuses = [
        error.response?.code,
        error.response?.status,
        error.networkDetails?.status,
        error.networkDetails?.statusCode,
    ]
    return statuses.find((status) => typeof status === "number") ?? null
}

/**
 * Thời điểm manifest hết dùng được — lấy hạn XA NHẤT trong các token segment, không phải gần nhất.
 *
 * Stream service ký theo cửa sổ bám tiến độ xem: token của đoạn đầu bài hết hạn sớm là CHUYỆN BÌNH
 * THƯỜNG, không có nghĩa manifest đã chết. Lấy hạn gần nhất ở đây thì trình phát sẽ đi xin manifest
 * mới ngay sau vài chục giây phát — mỗi lần xin là một lần dựng lại player, tức là tự tay làm khựa
 * video đang chạy ngon. Đoạn đã hết hạn mà người xem tua lùi vào thì CDN trả 403, và đường xử lý
 * 403 (xin nguồn mới, neo tại chỗ đang đứng) đã có sẵn.
 */
export const getHlsManifestTokenExpiryMs = (manifest: string): number | null => {
    const expiries = manifest
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0 && !line.startsWith("#"))
        .map(getHlsUrlTokenExpiryMs)
        .filter((expiry): expiry is number => expiry !== null)
    return expiries.length > 0 ? Math.max(...expiries) : null
}

/**
 * Some generated FTES VOD playlists end with a dangling EXTINF and omit ENDLIST.
 * hls.js correctly treats that syntax as a live playlist, which makes desktop playback
 * select the live edge instead of segment zero. Native mobile HLS happens to tolerate it.
 */
export const normalizeHlsVodManifest = (manifest: string): string => {
    const lines = manifest.replace(/\r\n?/g, "\n").split("\n")
    const isVod = lines.some((line) => /^#EXT-X-PLAYLIST-TYPE\s*:\s*VOD\s*$/i.test(line.trim()))
    const isMediaPlaylist = lines.some((line) => line.trim().startsWith("#EXTINF:"))
    if (!isVod || !isMediaPlaylist) return manifest

    const danglingExtinf = new Set<number>()
    lines.forEach((line, index) => {
        if (!line.trim().startsWith("#EXTINF:")) return
        const nextContent = lines.slice(index + 1).find((candidate) => candidate.trim().length > 0)
        if (!nextContent || nextContent.trim().startsWith("#")) danglingExtinf.add(index)
    })
    const hasEndList = lines.some((line) => line.trim() === "#EXT-X-ENDLIST")
    if (danglingExtinf.size === 0 && hasEndList) return manifest

    const normalized = lines.filter((_line, index) => !danglingExtinf.has(index))

    while (normalized.at(-1)?.trim() === "") normalized.pop()
    if (!hasEndList) {
        normalized.push("#EXT-X-ENDLIST")
    }
    return `${normalized.join("\n")}\n`
}

const makeUrisAbsolute = (manifest: string, sourceUrl: string): string => manifest
    .split("\n")
    .map((line) => {
        const trimmed = line.trim()
        if (trimmed && !trimmed.startsWith("#")) {
            return new URL(trimmed, sourceUrl).href
        }
        return line.replace(/URI="([^"]+)"/g, (_match, uri: string) => (
            `URI="${new URL(uri, sourceUrl).href}"`
        ))
    })
    .join("\n")

/**
 * Tải manifest MỘT lần rồi phục vụ chính bản đã tải qua Blob URL.
 *
 * <p>Trước đây bản không cần sửa được trả về nguyên URL gốc, nghĩa là hls.js đi tải LẠI — hai lượt
 * manifest cho mỗi lần nạp. Điều đó nay đắt và rủi ro: stream service giới hạn số lần một vé được
 * đổi lấy manifest (chống tải hàng loạt), nên lượt thừa ăn vào hạn ngạch của chính người học; và bản
 * hls.js tải lại KHÔNG chắc giống bản mình vừa kiểm — nó được ký lại theo thời điểm khác, neo khác,
 * hạn khác.
 */
export const prepareHlsVodManifestSource = async (
    sourceUrl: string,
    signal: AbortSignal,
): Promise<PreparedHlsSource> => {
    try {
        const response = await fetch(sourceUrl, {
            // A browser-cached master can contain already-expired segment grants.
            cache: "no-store",
            credentials: "omit",
            mode: "cors",
            signal,
        })
        if (!response.ok) {
            return { url: sourceUrl, expiresAtMs: null, windowPolicy: null, dispose: NOOP }
        }
        const manifest = await response.text()
        const expiresAtMs = getHlsManifestTokenExpiryMs(manifest)
        const windowPolicy = getHlsWindowPolicy(manifest)
        const absoluteManifest = makeUrisAbsolute(normalizeHlsVodManifest(manifest), sourceUrl)
        const blobUrl = URL.createObjectURL(new Blob(
            [absoluteManifest],
            { type: "application/vnd.apple.mpegurl" },
        ))
        return {
            url: blobUrl,
            expiresAtMs,
            windowPolicy,
            dispose: () => URL.revokeObjectURL(blobUrl),
        }
    } catch {
        return { url: sourceUrl, expiresAtMs: null, windowPolicy: null, dispose: NOOP }
    }
}
