import { renderHook, act } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { SelfProfile } from "@/modules/api/rest/profile"

/**
 * Unit — form `/profile/edit` (`useEditProfileForm`).
 *
 * GHIM MỘT SỰ THẬT VỀ MẤT DỮ LIỆU: **lưu hồ sơ không được ghi đè `majorCode` khi người dùng không
 * đụng tới nó.** Trường này có quy ước PATCH ngược với mọi trường khác (`null` = giữ nguyên, chuỗi
 * RỖNG = XOÁ) và giá trị seed lại đến từ một service KHÁC (danh mục ngành ở Workspace, qua
 * `MajorCatalogApi` có đường lùi trả empty). Cộng hai thứ đó: Workspace nghẽn ⇒ `GET /profiles/me`
 * trả `academic.majorCode = null` ⇒ form seed `""` ⇒ người dùng chỉ sửa bio ⇒ PATCH gửi `""` ⇒
 * ngành trong DB bị XOÁ vĩnh viễn, không cảnh báo. Trước bản vá, `majorCode` được gửi VÔ ĐIỀU KIỆN
 * ở mọi lần lưu nên đúng kịch bản đó xảy ra.
 */

const PROFILE_KEY = ["profiles", "me", "u-1"] as const

let profile: SelfProfile | undefined
const mutate = vi.fn()

vi.mock("swr", () => ({
    default: () => ({ data: profile, mutate }),
}))

const updateSelfProfile = vi.fn()
const replaceSocialLinks = vi.fn()
const uploadAvatar = vi.fn()

vi.mock("@/modules/api/rest/profile", () => ({
    getSelfProfile: vi.fn(),
    updateSelfProfile: (...args: Array<unknown>) => updateSelfProfile(...args),
    replaceSocialLinks: (...args: Array<unknown>) => replaceSocialLinks(...args),
    uploadAvatar: (...args: Array<unknown>) => uploadAvatar(...args),
}))

vi.mock("@/components/features/profile/hooks/useQueryProfileSwr", () => ({
    useSelfProfileKey: () => PROFILE_KEY,
}))

// Bọc toast thật cần redux + provider; ở đây chỉ cần nó CHẠY hành động và trả kết quả.
vi.mock("@/modules/toast/hooks", () => ({
    useRestWithToast: () => async (action: () => Promise<unknown>) => await action(),
}))

import { majorCodePatch, useEditProfileForm } from "./useEditProfileForm"

/** Hồ sơ như `GET /profiles/me` trả về; `majorCode` truyền vào để dựng từng kịch bản. */
const selfProfile = (majorCode: string | null): SelfProfile => ({
    displayName: "Minh",
    bio: "Xin chào",
    jobTitle: "Sinh viên",
    address: "Hà Nội",
    socialLinks: [],
    academic: { campus: "HN", majorCode },
} as unknown as SelfProfile)

/** Chạy submit của form (RHF `handleSubmit` chấp nhận không có event). */
const submitWith = async (edit?: (setValue: (value: string) => void) => void) => {
    const { result } = renderHook(() => useEditProfileForm())
    if (edit) {
        await act(async () => {
            edit((value) => result.current.setValue("majorCode", value))
        })
    }
    await act(async () => {
        await result.current.onSubmit()
    })
    return updateSelfProfile.mock.calls.at(-1)?.[0] as { majorCode?: string | null } | undefined
}

beforeEach(() => {
    mutate.mockReset()
    mutate.mockResolvedValue(undefined)
    updateSelfProfile.mockReset()
    updateSelfProfile.mockResolvedValue(undefined)
    replaceSocialLinks.mockReset()
    replaceSocialLinks.mockResolvedValue(undefined)
    uploadAvatar.mockReset()
    uploadAvatar.mockResolvedValue(undefined)
})

describe("majorCodePatch", () => {
    it("không đổi ⇒ null = ĐỪNG ĐỤNG TỚI (kể cả khi cả hai đều rỗng)", () => {
        expect(majorCodePatch("SE", "SE")).toBeNull()
        expect(majorCodePatch(null, "")).toBeNull()
        expect(majorCodePatch(undefined, "")).toBeNull()
        // Khoảng trắng thừa không phải là một thay đổi.
        expect(majorCodePatch("SE", " SE ")).toBeNull()
    })

    it("đổi thật thì vẫn gửi — kể cả khi người dùng CHỦ ĐỘNG bỏ chọn ngành", () => {
        expect(majorCodePatch("", "SE")).toBe("SE")
        expect(majorCodePatch("SE", "AI")).toBe("AI")
        // Chuỗi rỗng = XOÁ theo quy ước BE; bỏ chọn có chủ đích phải đi tới nơi.
        expect(majorCodePatch("SE", "")).toBe("")
    })
})

describe("useEditProfileForm — majorCode", () => {
    /**
     * KỊCH BẢN MẤT DỮ LIỆU: Workspace chết nên `GET /profiles/me` trả majorCode = null, form seed
     * "", người dùng chỉ sửa bio. Ngành đang lưu trong DB (`SE`) KHÔNG được đụng tới.
     */
    it("không gửi majorCode khi người dùng không đụng tới nó (danh mục ngành đọc lỗi)", async () => {
        profile = selfProfile(null)

        const body = await submitWith()

        expect(updateSelfProfile).toHaveBeenCalledTimes(1)
        expect(body?.majorCode ?? null).toBeNull()
        // Chuỗi rỗng là LỆNH XOÁ — tuyệt đối không được xuất hiện ở lần lưu không ai đụng ngành.
        expect(body?.majorCode).not.toBe("")
    })

    /**
     * Chiều còn lại của cùng một lỗi: ngành bị chuyển INACTIVE thì đường ĐỌC vẫn trả mã còn đường
     * GHI từ chối ⇒ gửi lại y nguyên mã đã seed sẽ làm MỌI lần lưu hồ sơ 400 PROFILE_INVALID_MAJOR
     * ở một trường người dùng không hề chạm vào (mà avatar thì đã upload xong ở bước 1).
     */
    it("không gửi lại mã ngành đã seed khi người dùng chỉ sửa trường khác", async () => {
        profile = selfProfile("SE")

        const body = await submitWith()

        expect(body?.majorCode ?? null).toBeNull()
    })

    it("gửi khi người dùng thật sự chọn ngành khác", async () => {
        profile = selfProfile("SE")

        const body = await submitWith((setValue) => setValue("AI"))

        expect(body?.majorCode).toBe("AI")
    })

    it("gửi chuỗi rỗng khi người dùng chủ động bỏ chọn ngành", async () => {
        profile = selfProfile("SE")

        const body = await submitWith((setValue) => setValue(""))

        expect(body?.majorCode).toBe("")
    })
})

describe("useEditProfileForm — avatar persistence", () => {
    it("uploads a cropped avatar immediately and hydrates the shared profile cache", async () => {
        profile = selfProfile("SE")
        const uploadedProfile = {
            ...profile,
            avatarUrl: "https://cdn.example/avatar.jpg",
        } as SelfProfile
        uploadAvatar.mockResolvedValue(uploadedProfile)
        const { result } = renderHook(() => useEditProfileForm())
        const cropped = new File(["avatar"], "avatar.jpg", { type: "image/jpeg" })

        let saved = false
        await act(async () => {
            saved = await result.current.onAvatarFile(cropped)
        })

        expect(saved).toBe(true)
        expect(uploadAvatar).toHaveBeenCalledTimes(1)
        expect(uploadAvatar).toHaveBeenCalledWith(cropped)
        expect(mutate).toHaveBeenNthCalledWith(1, uploadedProfile, { revalidate: false })
        expect(mutate).toHaveBeenCalledTimes(2)
        // No text-form submit was needed to make the avatar durable.
        expect(updateSelfProfile).not.toHaveBeenCalled()
    })
})
