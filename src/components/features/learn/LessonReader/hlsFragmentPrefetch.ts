import type {
    FragmentLoaderContext,
    HlsConfig,
    Loader,
    LoaderCallbacks,
    LoaderConfiguration,
    LoaderContext,
    LoaderStats,
} from "hls.js"

/** In-memory responses keyed by the exact signed fragment URL hls.js will request. */
export type HlsFragmentPrefetchCache = Map<string, Promise<ArrayBuffer>>

type HlsLoaderConstructor = new (config: HlsConfig) => Loader<LoaderContext>

const emptyStats = (): LoaderStats => ({
    aborted: false,
    loaded: 0,
    retry: 0,
    total: 0,
    chunkCount: 0,
    bwEstimate: 0,
    loading: { start: 0, first: 0, end: 0 },
    parsing: { start: 0, end: 0 },
    buffering: { start: 0, first: 0, end: 0 },
})

/**
 * Starts the first fragment requests together instead of making the user wait for the
 * normal download -> transmux -> append sequence five times. Responses stay in memory
 * until hls.js consumes them, so this also works while DevTools has HTTP cache disabled.
 */
export const prefetchHlsFragments = (
    urls: Array<string>,
    signal: AbortSignal,
): HlsFragmentPrefetchCache => new Map(
    urls.map((url) => [
        url,
        fetch(url, {
            cache: "no-store",
            credentials: "omit",
            mode: "cors",
            signal,
        }).then((response) => {
            if (!response.ok) {
                throw new Error(`fragment ${response.status}`)
            }
            return response.arrayBuffer()
        }),
    ]),
)

/**
 * Fragment-loader class backed by prefetched ArrayBuffers. URLs outside the startup
 * cache (or failed prefetches) transparently use hls.js's normal loader.
 */
export const createPrefetchedFragmentLoader = (
    BaseLoader: HlsLoaderConstructor,
    cache: HlsFragmentPrefetchCache,
): new (config: HlsConfig) => Loader<FragmentLoaderContext> => class PrefetchedFragmentLoader
implements Loader<FragmentLoaderContext> {
    public context: FragmentLoaderContext | null = null
    public stats: LoaderStats = emptyStats()

    private delegate: Loader<LoaderContext>
    private destroyed = false

    constructor(private readonly config: HlsConfig) {
        this.delegate = new BaseLoader(config)
    }

    load(
        context: FragmentLoaderContext,
        loaderConfig: LoaderConfiguration,
        callbacks: LoaderCallbacks<FragmentLoaderContext>,
    ): void {
        this.context = context
        const prefetched = cache.get(context.url)
        if (!prefetched) {
            this.loadNormally(context, loaderConfig, callbacks)
            return
        }

        cache.delete(context.url)
        const startedAt = performance.now()
        this.stats.loading.start = startedAt
        void prefetched.then((data) => {
            if (this.destroyed || this.stats.aborted) return
            const completedAt = performance.now()
            this.stats.loading.first = completedAt
            this.stats.loading.end = completedAt
            this.stats.loaded = data.byteLength
            this.stats.total = data.byteLength
            this.stats.chunkCount = 1
            this.stats.bwEstimate = data.byteLength > 0
                ? data.byteLength * 8000 / Math.max(1, completedAt - startedAt)
                : 0
            callbacks.onSuccess(
                { url: context.url, data, code: 200 },
                this.stats,
                context,
                null,
            )
        }).catch(() => {
            if (!this.destroyed && !this.stats.aborted) {
                this.loadNormally(context, loaderConfig, callbacks)
            }
        })
    }

    abort(): void {
        this.stats.aborted = true
        this.delegate.abort()
    }

    destroy(): void {
        this.destroyed = true
        this.delegate.destroy()
        this.context = null
    }

    getCacheAge(): number | null {
        return this.delegate.getCacheAge?.() ?? null
    }

    getResponseHeader(name: string): string | null {
        return this.delegate.getResponseHeader?.(name) ?? null
    }

    private loadNormally(
        context: FragmentLoaderContext,
        loaderConfig: LoaderConfiguration,
        callbacks: LoaderCallbacks<FragmentLoaderContext>,
    ): void {
        this.delegate = new BaseLoader(this.config)
        this.stats = this.delegate.stats
        this.delegate.load(
            context,
            loaderConfig,
            callbacks as unknown as LoaderCallbacks<LoaderContext>,
        )
    }
}
