export interface PreparedHlsSource {
    url: string
    expiresAtMs: number | null
    dispose: () => void
}

const NOOP = () => undefined

const decodeTokenExpiryMs = (token: string): number | null => {
    try {
        const encoded = token.split(".")[0].replace(/-/g, "+").replace(/_/g, "/")
        const padded = encoded.padEnd(Math.ceil(encoded.length / 4) * 4, "=")
        const payload = JSON.parse(atob(padded)) as { e?: unknown }
        return typeof payload.e === "number" ? payload.e * 1000 : null
    } catch {
        return null
    }
}

export const getHlsUrlTokenExpiryMs = (url: string): number | null => {
    try {
        const token = new URL(url).searchParams.get("t")
        return token ? decodeTokenExpiryMs(token) : null
    } catch {
        return null
    }
}

export const getHlsManifestTokenExpiryMs = (manifest: string): number | null => {
    const expiries = manifest
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0 && !line.startsWith("#"))
        .map(getHlsUrlTokenExpiryMs)
        .filter((expiry): expiry is number => expiry !== null)
    return expiries.length > 0 ? Math.min(...expiries) : null
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
 * Fetches only desktop media playlists that need repair and serves the corrected text
 * through a short-lived Blob URL. Multivariant playlists and valid VOD manifests keep
 * their original URL so hls.js retains its normal loading behaviour.
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
        if (!response.ok) return { url: sourceUrl, expiresAtMs: null, dispose: NOOP }
        const manifest = await response.text()
        const expiresAtMs = getHlsManifestTokenExpiryMs(manifest)
        const normalized = normalizeHlsVodManifest(manifest)
        if (normalized === manifest) return { url: sourceUrl, expiresAtMs, dispose: NOOP }

        const absoluteManifest = makeUrisAbsolute(normalized, sourceUrl)
        const blobUrl = URL.createObjectURL(new Blob(
            [absoluteManifest],
            { type: "application/vnd.apple.mpegurl" },
        ))
        return {
            url: blobUrl,
            expiresAtMs,
            dispose: () => URL.revokeObjectURL(blobUrl),
        }
    } catch {
        return { url: sourceUrl, expiresAtMs: null, dispose: NOOP }
    }
}
