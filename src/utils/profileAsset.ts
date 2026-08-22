/**
 * Local gamification art is intentionally high-resolution, and several SVGs embed 1–2 MB PNGs.
 * Small identity surfaces must use the generated WebP derivative instead of downloading originals.
 */
export const profileAssetThumbnailUrl = (url: string | null | undefined): string | null => {
    const value = url?.trim()
    if (!value) {
        return null
    }
    const match = value.match(
        // Keep in step with `groups` in scripts/generate-profile-thumbnails.mjs.
        /^\/gamification\/(avatars|frames|achievements|badges)\/([^/?#]+)\.(?:svg|png|jpe?g|webp)(?:[?#].*)?$/i,
    )
    if (!match) {
        return value
    }
    return `/gamification/profile-thumbnails/${match[1].toLowerCase()}-${match[2]}.webp`
}

/**
 * Art nhận diện VUÔNG BO GÓC đời đầu → bản `-round` đã vẽ lại: 5 khung viền hạng
 * (`frame-*.svg` → `frame-*-round.svg`) và 9 avatar mặc định FrosTES
 * (`avatar-NN-*.svg` → `avatar-NN-*-round.png`).
 *
 * <p><b>Vì sao FE phải tự đổi con trỏ.</b> Đường dẫn nằm trong DB
 * (`profile.avatar_frames.asset_url`, `profile.default_avatars.image_url`,
 * `profiles.avatar_url`) nhưng FILE ART là tài sản của FE (`public/gamification/`). Đợt
 * vẽ lại hình tròn ship 14 file `-round` mới và bàn giao migration
 * `V375__circular_avatar_and_frame_art.sql` cho backend; migration ĐÃ có trong source
 * backend nhưng CHƯA chạy trên môi trường đang dùng, nên danh mục vẫn trả art vuông.
 *
 * <p><b>Hai lỗi chủ dự án chụp lại đều là hệ quả của đúng chỗ lệch này.</b> Khung vuông
 * bọc avatar tròn thì vành trong của khung bị mép ảnh trùm ở 4 cạnh và hở nền ở 4 góc
 * ("viền bị avatar đè"). Còn avatar mặc định vuông bo góc, tuy `.avatar` đã cắt tròn từ
 * #252, vẫn đọc ra hình VUÔNG: 4 góc của art trong suốt và bo vào SÂU HƠN đường tròn cắt,
 * nên lộ 4 múi `bg-default` — cắt tròn một ô vuông bo góc không ra hình tròn.
 *
 * <p>Một hàm ở đây gỡ ràng buộc "FE đổi tên file thì phải deploy DB cùng nhịp" — cùng
 * tinh thần với {@link profileAssetThumbnailUrl}, vốn cũng viết lại đường dẫn art cục bộ
 * ngay tại FE thay vì bắt BE lưu sẵn đường thumbnail. Ảnh người dùng TỰ TẢI LÊN và ảnh
 * ngoài (DiceBear, CDN) không khớp mẫu nên đi thẳng, không sứt mẻ gì.
 *
 * <p><b>Chạy hai lần vẫn ra một kết quả:</b> chỉ khớp đúng tên art ĐỜI ĐẦU, nên khi V375
 * chạy xong và DB trả thẳng `-round` thì hàm này là no-op — không có `-round-round`. Xoá
 * hàm khi art cũ bị dọn (task 7.2 của change `avatar-circular-shape-and-frames`).
 *
 * @param url - đường dẫn art lấy từ BE; có thể là url ngoài hoặc rỗng.
 */
export const roundProfileArtUrl = (url: string | null | undefined): string | null => {
    const value = url?.trim()
    if (!value) {
        return null
    }
    return value
        .replace(
            /^(\/gamification\/frames\/frame-(?:bronze|silver|gold|crystal|diamond))\.svg$/i,
            "$1-round.svg",
        )
        .replace(/^(\/gamification\/avatars\/avatar-\d{2}-[a-z]+)\.svg$/i, "$1-round.png")
}
