import React from "react"
import { act, render, waitFor } from "@testing-library/react"
import { SWRConfig, useSWRConfig } from "swr"
import type { Cache, ScopedMutator } from "swr"
import { beforeEach, describe, expect, it, vi } from "vitest"

/**
 * Integration — sau khi ĐĂNG BÀI, feed cộng đồng phải nạp lại THẬT.
 *
 * Hồi quy cho bug "đăng bài xong quay lại /community không thấy bài, F5 mới thấy":
 * `CommunityComposerForm` gọi {@link revalidateCommunityFeeds}, nhưng `mutate(<$inf$ key>)`
 * của SWR global KHÔNG bật cờ force (`_i`) mà chỉ hook infinite tự gọi `mutate()` mới bật.
 * Với `revalidateFirstPage: false` (cấu hình của feed), fetcher infinite thấy mọi trang đã
 * có trong cache nên TRẢ LẠI Y NGUYÊN bản cũ — không request nào bay đi (no-op im lặng).
 *
 * Test dựng hook feed THẬT trên SWR thật (chỉ spy tầng GraphQL), đếm số lần gọi query và
 * kiểm nội dung feed sau khi revalidate.
 */

vi.mock("next-intl", () => ({ useLocale: () => "vi" }))

const feedItem = (id: string) => ({
    id,
    authorId: "a1",
    author: { id: "a1", username: "a", displayName: "A", avatarUrl: null, staffRole: null },
    pinned: false,
    createdAt: "2026-08-15T00:00:00Z",
    title: id,
    snippet: id,
    likeCount: 0,
    likedByMe: false,
    commentCount: 0,
    media: [],
})

let items = [feedItem("p1")]
const queryCommunityFeed = vi.fn(async () => ({
    data: { feed: { items, nextCursor: null } },
}))
vi.mock("@/modules/api/graphql/queries/query-community-feed", () => ({
    // Chỉ cần một selection HỢP LỆ: query-community-search nhúng hằng này vào tài liệu gql
    // và parse ngay lúc import, chuỗi rỗng sẽ vỡ cú pháp.
    FEED_SELECTION: "id",
    FeedTab: { ForYou: "FOR_YOU", Following: "FOLLOWING", Campus: "CAMPUS", Trending: "TRENDING" },
    queryCommunityFeed: () => queryCommunityFeed(),
}))

import { revalidateCommunityFeeds, useQueryCommunityFeedSwr } from "./useQueryCommunityFeedSwr"

/** Chỗ móc `cache`/`mutate` — sống ngoài feed, như phần vỏ app không unmount khi đổi trang. */
const Probe = ({ onReady }: { onReady: (swr: { cache: Cache; mutate: ScopedMutator }) => void }) => {
    const { cache, mutate } = useSWRConfig()
    onReady({ cache, mutate })
    return null
}

/** Feed THẬT (chỉ tầng GraphQL bị spy); mount/unmount theo điều hướng trang. */
const Feed = ({ seen }: { seen: Array<string> }) => {
    const { posts } = useQueryCommunityFeedSwr()
    seen.length = 0
    seen.push(...posts.map((post) => post.id))
    return null
}

/**
 * Dựng app với MỘT cache SWR duy nhất (provider tạo một lần, y như app thật), rồi cho phép
 * gỡ/mount lại riêng feed để mô phỏng rời `/community` và quay lại.
 */
const renderApp = () => {
    const seen: Array<string> = []
    let swr = {} as { cache: Cache; mutate: ScopedMutator }
    const store = new Map()
    const provider = () => store
    const tree = (showFeed: boolean) => (
        <SWRConfig value={{ provider, dedupingInterval: 0 }}>
            <Probe onReady={(next) => { swr = next }} />
            {showFeed ? <Feed seen={seen} /> : null}
        </SWRConfig>
    )
    const view = render(tree(true))
    return {
        seen,
        swr: () => swr,
        showFeed: (show: boolean) => act(() => { view.rerender(tree(show)) }),
    }
}

beforeEach(() => {
    items = [feedItem("p1")]
    queryCommunityFeed.mockClear()
})

describe("revalidateCommunityFeeds", () => {
    it("bài vừa đăng xuất hiện mà không cần F5 (thực sự gọi lại BE)", async () => {
        // Đăng qua MODAL: feed vẫn đang mount ngay lúc revalidate.
        const { seen, swr } = renderApp()
        await waitFor(() => expect(queryCommunityFeed).toHaveBeenCalledTimes(1))
        expect(seen).toEqual(["p1"])

        // BE giờ đã có bài mới (vừa POST /community/posts xong).
        items = [feedItem("p2"), feedItem("p1")]

        await act(async () => {
            await revalidateCommunityFeeds(swr().cache, swr().mutate)
        })

        expect(queryCommunityFeed).toHaveBeenCalledTimes(2)
        await waitFor(() => expect(seen).toEqual(["p2", "p1"]))
    })

    it("đăng từ trang /community/new (feed đã unmount) thì lần quay lại vẫn nạp lại", async () => {
        const { seen, swr, showFeed } = renderApp()
        await waitFor(() => expect(queryCommunityFeed).toHaveBeenCalledTimes(1))
        // Rời /community sang trang soạn bài → hook feed unmount, cache thì vẫn còn.
        showFeed(false)

        items = [feedItem("p2"), feedItem("p1")]
        await act(async () => {
            await revalidateCommunityFeeds(swr().cache, swr().mutate)
        })

        // Quay lại /community: feed mount lại và phải hiện bài mới.
        showFeed(true)
        await waitFor(() => expect(seen).toEqual(["p2", "p1"]))
    })
})
