import type {
    FragmentLoaderContext,
    HlsConfig,
    LoaderCallbacks,
    LoaderConfiguration,
} from "hls.js"
import { afterEach, describe, expect, it, vi } from "vitest"
import {
    createPrefetchedFragmentLoader,
    prefetchHlsFragments,
} from "./hlsFragmentPrefetch"

afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
})

describe("HLS fragment prefetch", () => {
    it("starts the first five fragment requests in parallel", async () => {
        const responses: Array<(value: unknown) => void> = []
        vi.stubGlobal("fetch", vi.fn(() => new Promise((resolve) => responses.push(resolve))))
        const urls = Array.from({ length: 5 }, (_, index) => `https://video.example/${index}.ts`)

        const prefetched = prefetchHlsFragments(urls, new AbortController().signal)

        expect(fetch).toHaveBeenCalledTimes(5)
        responses.forEach((resolve, index) => resolve({
            ok: true,
            arrayBuffer: () => Promise.resolve(new Uint8Array([index]).buffer),
        }))
        await expect(Promise.all(prefetched.values())).resolves.toHaveLength(5)
    })

    it("serves a prefetched response from memory without another network load", async () => {
        const normalLoad = vi.fn()
        class BaseLoader {
            context = null
            stats = {
                aborted: false,
                loaded: 0,
                retry: 0,
                total: 0,
                chunkCount: 0,
                bwEstimate: 0,
                loading: { start: 0, first: 0, end: 0 },
                parsing: { start: 0, end: 0 },
                buffering: { start: 0, first: 0, end: 0 },
            }
            load = normalLoad
            abort = vi.fn()
            destroy = vi.fn()
        }
        const url = "https://video.example/seg_00000.ts"
        const bytes = new Uint8Array([1, 2, 3]).buffer
        const Loader = createPrefetchedFragmentLoader(
            BaseLoader as never,
            new Map([[url, Promise.resolve(bytes)]]),
        )
        const loader = new Loader({} as HlsConfig)
        const onSuccess = vi.fn()

        loader.load(
            { url } as FragmentLoaderContext,
            {} as LoaderConfiguration,
            { onSuccess } as unknown as LoaderCallbacks<FragmentLoaderContext>,
        )
        await vi.waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1))

        expect(normalLoad).not.toHaveBeenCalled()
        expect(onSuccess.mock.calls[0][0]).toMatchObject({ url, data: bytes, code: 200 })
    })
})
