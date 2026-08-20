import React from "react"
import { SWRConfig } from "swr"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

/**
 * Component — {@link ProfileFollowButton} (cờ follow phải sống sót F5).
 *
 * Bug: nút reset về "Theo dõi" sau khi tải lại trang. Trước F5 nó đúng chỉ nhờ vá lạc quan
 * trong cache SWR; F5 xoá cache nên nút vẽ lại theo `profile.isFollowedByMe` của
 * `GET /profiles/{username}` — mà trường đó hiện LUÔN `false` (trong service core,
 * `FollowStatusPort` còn là stub).
 *
 * Test này ghim đúng chỗ sửa: nguồn đọc cờ là lô batch `GET /community/follows/me`
 * (đúng bảng mà PUT/DELETE `/community/follows/{userId}` vừa ghi), KHÔNG phải cờ của hồ sơ.
 * Nếu ai đó đọc lại `profile.isFollowedByMe` thì cả hai ca dưới đây fail.
 */

const hoisted = vi.hoisted(() => ({
    getFollowedUserIds: vi.fn<(ids: ReadonlyArray<string>) => Promise<Array<string>>>(),
    followUser: vi.fn<(id: string) => Promise<void>>(),
    unfollowUser: vi.fn<(id: string) => Promise<void>>(),
}))

vi.mock("next-intl", () => ({
    useTranslations: () => (key: string) => key,
}))

vi.mock("@heroui/react", () => ({
    Button: ({
        children,
        onPress,
        isDisabled,
        variant,
    }: {
        children?: React.ReactNode | ((state: { isPending: boolean }) => React.ReactNode)
        onPress?: () => void
        isDisabled?: boolean
        variant?: string
    }) => (
        <button type="button" onClick={onPress} disabled={isDisabled} data-variant={variant}>
            {typeof children === "function" ? children({ isPending: false }) : children}
        </button>
    ),
    Spinner: () => null,
    toast: { danger: vi.fn() },
}))

vi.mock("@/modules/api/rest/community", () => ({
    getFollowedUserIds: (ids: ReadonlyArray<string>) => hoisted.getFollowedUserIds(ids),
    followUser: (id: string) => hoisted.followUser(id),
    unfollowUser: (id: string) => hoisted.unfollowUser(id),
    FOLLOW_BATCH_LIMIT: 100,
}))

vi.mock("@/modules/api/rest/profile", () => ({
    getPublicProfile: vi.fn(),
}))

// Người xem đã đăng nhập: lô batch mới được phép gọi (nó đọc cạnh follow của chính caller).
vi.mock("@/redux/hooks", () => ({
    useAppSelector: (selector: (state: unknown) => unknown) =>
        selector({ keycloak: { authenticated: true }, user: { user: { id: "viewer-1" } } }),
}))

vi.mock("@/hooks/useRequireAuth", () => ({
    useRequireAuth: () => ({
        authenticated: true,
        requireAuth: () => true,
        requireAuthAsync: async () => true,
        guard: (action: (...args: Array<unknown>) => void) => action,
    }),
}))

import type { PublicProfile } from "../../hooks/useQueryPublicProfileSwr"
import { ProfileFollowButton } from "./index"

const USER_ID = "11111111-2222-3333-4444-555555555555"

/**
 * Hồ sơ như BE ĐANG trả về hôm nay: `isFollowedByMe: false` kể cả khi người xem đang follow.
 */
const profile = {
    userId: USER_ID,
    username: "minh-tran",
    name: "Minh Trần",
    headline: "",
    about: "",
    campus: "",
    skills: [],
    followers: 10,
    following: 4,
    avatarUrl: "",
    avatarFrameCode: "",
    equippedAchievement: null,
    contactEmail: "",
    phone: "",
    academic: null,
    socialLinks: [],
    projects: [],
    achievements: [],
    assets: [],
    isFollowedByMe: false,
} satisfies PublicProfile

const wrapper = ({ children }: { children: React.ReactNode }) => (
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>{children}</SWRConfig>
)

beforeEach(() => {
    hoisted.getFollowedUserIds.mockReset()
    hoisted.followUser.mockReset().mockResolvedValue(undefined)
    hoisted.unfollowUser.mockReset().mockResolvedValue(undefined)
})

describe("ProfileFollowButton", () => {
    it("vẽ 'Đang theo dõi' sau F5 khi community nói có, dù hồ sơ trả isFollowedByMe=false", async () => {
        // Cache rỗng = đúng trạng thái ngay sau khi tải lại trang.
        hoisted.getFollowedUserIds.mockResolvedValue([USER_ID])

        render(<ProfileFollowButton profile={profile} />, { wrapper })

        // Không có setup jest-dom trong repo ⇒ kiểm DOM trực tiếp.
        await waitFor(() =>
            expect(screen.getByRole("button").textContent).toBe("hovercard.unfollow"),
        )
        expect(hoisted.getFollowedUserIds).toHaveBeenCalledWith([USER_ID])
        expect(screen.getByRole("button").getAttribute("data-variant")).toBe("secondary")
    })

    it("bấm khi đang theo dõi thì BỎ theo dõi (không follow lại)", async () => {
        hoisted.getFollowedUserIds.mockResolvedValue([USER_ID])

        render(<ProfileFollowButton profile={profile} />, { wrapper })
        await waitFor(() =>
            expect(screen.getByRole("button").textContent).toBe("hovercard.unfollow"),
        )

        fireEvent.click(screen.getByRole("button"))

        await waitFor(() => expect(hoisted.unfollowUser).toHaveBeenCalledWith(USER_ID))
        expect(hoisted.followUser).not.toHaveBeenCalled()
    })

    // Hai ca dưới phủ đúng hai nhánh mà `swr.data` KHÔNG có giá trị. Cả hai từng rơi thẳng về
    // `profile.isFollowedByMe` — cờ mà BE stub `false` cứng — tức là mở lại đúng con bug vừa vá.
    it("lô batch fail sạch (401/429/offline) thì KHÔNG đoán bừa là 'chưa theo dõi'", async () => {
        // `fetchFollowedUserIds` throw khi mọi lot fail ⇒ SWR không có data, chỉ có error.
        hoisted.getFollowedUserIds.mockRejectedValue(new Error("401"))

        render(<ProfileFollowButton profile={profile} />, { wrapper })

        await waitFor(() => expect(screen.getByRole("button").hasAttribute("disabled")).toBe(true))

        // Và cú bấm không được ghi gì: quan hệ có thể đã tồn tại sẵn.
        fireEvent.click(screen.getByRole("button"))
        expect(hoisted.followUser).not.toHaveBeenCalled()
        expect(hoisted.unfollowUser).not.toHaveBeenCalled()
    })

    it("khoá nút khi câu trả lời còn đang bay, rồi mở ra với nhãn ĐÚNG", async () => {
        let answer: (ids: Array<string>) => void = () => {}
        hoisted.getFollowedUserIds.mockReturnValue(
            new Promise<Array<string>>((resolve) => {
                answer = resolve
            }),
        )

        render(<ProfileFollowButton profile={profile} />, { wrapper })

        // Chưa có câu trả lời: không được mời "Theo dõi" (rồi lật nhãn lẫn variant sau 1 RTT).
        await waitFor(() => expect(screen.getByRole("button").hasAttribute("disabled")).toBe(true))
        fireEvent.click(screen.getByRole("button"))
        expect(hoisted.followUser).not.toHaveBeenCalled()

        answer([USER_ID])

        await waitFor(() =>
            expect(screen.getByRole("button").textContent).toBe("hovercard.unfollow"),
        )
        expect(screen.getByRole("button").hasAttribute("disabled")).toBe(false)
    })
})
